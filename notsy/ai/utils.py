from dataclasses import dataclass
import json
import os
import uuid

import pandas as pd
from dotenv import load_dotenv
from google import genai
from google.genai import types
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone
from PyPDF2 import PdfReader

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")


def load_optional_csv(filename, columns):
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        return pd.DataFrame(columns=columns)
    return pd.read_csv(filepath)


OPENAI_DF = load_optional_csv("openai_docs_chunked.csv", ["id", "text"])
GFG_DF = load_optional_csv("gfg_cleaned.csv", ["url", "text"])


@dataclass
class TextResponse:
    output_text: str


def initialize_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured")
    return genai.Client(api_key=api_key)


def initialize_pincone():
    pine_key = os.getenv("PINE_API_KEY")
    host = os.getenv("PINE_HOST")

    if not pine_key:
        raise ValueError("PINE_API_KEY is not configured")
    if not host:
        raise ValueError("PINE_HOST is not configured")

    pc = Pinecone(api_key=pine_key)
    return pc.Index(host=host)


def get_embedding(client, text, model=DEFAULT_GEMINI_EMBED_MODEL, task_type="RETRIEVAL_DOCUMENT", title=None):
    text = text.replace("\n", " ").strip()
    config_kwargs = {"task_type": task_type,
                     "output_dimensionality": 768}
    if title:
        config_kwargs["title"] = title

    result = client.models.embed_content(
        model=model,
        contents=text,
        config=types.EmbedContentConfig(**config_kwargs),
    )

    if not result.embeddings:
        raise ValueError("Gemini returned no embedding")

    return result.embeddings[0].values


def create_chunks(text):
    normalized_text = (text or "").strip()
    if not normalized_text:
        return []

    if len(normalized_text) <= 24000:
        return [normalized_text]

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=24000,
        chunk_overlap=500,
    )
    return text_splitter.split_text(normalized_text)


def upsert_text(text, metadata, namespace):
    chunks = create_chunks(text)
    client = initialize_gemini_client()
    index = initialize_pincone()

    if "topic_id" not in metadata:
        raise ValueError("topic_id not found in metadata")
    if "user_id" not in metadata:
        raise ValueError("user_id not found in metadata")

    title = metadata.get("filename") or metadata.get("url")

    for chunk in chunks:
        try:
            unique_id = str(uuid.uuid4())
            chunk_metadata = {**metadata, "text": chunk[:500]}
            vector = {
                "id": f"vec-{metadata['topic_id']}-{metadata.get('url', 'resource')}-{unique_id}",
                "values": get_embedding(
                    client=client,
                    text=chunk,
                    model=DEFAULT_GEMINI_EMBED_MODEL,
                    task_type="RETRIEVAL_DOCUMENT",
                    title=title,
                ),
                "metadata": chunk_metadata,
            }
            index.upsert(vectors=[vector], namespace=namespace)
        except Exception as e:
            raise Exception(f"Error in upserting data to Pinecone: {str(e)}")


def query(text, namespace, top_k):
    threshold = 0.0
    index = initialize_pincone()

    data_chunks = create_chunks(text)
    if not data_chunks:
        raise ValueError("No chunks returned from the input text. Check create_chunks() logic.")
    data = data_chunks[0]

    vector = get_embedding(
        client=initialize_gemini_client(),
        text=data,
        model=DEFAULT_GEMINI_EMBED_MODEL,
        task_type="RETRIEVAL_QUERY",
    )

    answer = index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True,
        namespace=namespace,
    )

    result = []
    matches = answer.get("matches", []) if isinstance(answer, dict) else getattr(answer, "matches", [])
    if not matches:
        return result

    for match in matches:
        score = match.get("score", 0) if isinstance(match, dict) else getattr(match, "score", 0)
        if score < threshold:
            continue

        metadata = match.get("metadata", {}) if isinstance(match, dict) else getattr(match, "metadata", {})
        if namespace == "openai-ref":
            match_id = match.get("id") if isinstance(match, dict) else getattr(match, "id", None)
            content_row = OPENAI_DF[OPENAI_DF["id"] == match_id]
            if content_row.empty:
                continue
            content = content_row["text"].values[0]
            result.append({"content": content, "metadata": metadata})
        elif namespace == "gfg":
            url = metadata.get("url")
            content_row = GFG_DF[GFG_DF["url"] == url]
            if content_row.empty:
                continue
            content = content_row["text"].values[0]
            result.append({"content": content, "metadata": metadata})
        else:
            content = metadata.get("text", "")
            result.append({"content": content, "metadata": metadata})

    return result


def clean_messages_for_gpt(messages):
    return [{"role": msg["role"], "content": msg["content"]} for msg in messages if "role" in msg and "content" in msg]


def _format_messages_as_prompt(messages):
    formatted = []
    for message in messages:
        role = (message.get("role") or "user").upper()
        content = message.get("content", "")
        if isinstance(content, list):
            content = "\n".join(str(item) for item in content)
        formatted.append(f"{role}:\n{content}")
    return "\n\n".join(formatted)


def _extract_text(response):
    text = getattr(response, "text", None)
    if text:
        return text

    candidates = getattr(response, "candidates", None) or []
    parts = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(part_text)
    return "\n".join(parts).strip()


def generate_text(prompt_or_messages, model=DEFAULT_GEMINI_MODEL, temperature=None, max_output_tokens=None):
    client = initialize_gemini_client()
    contents = (
        _format_messages_as_prompt(prompt_or_messages)
        if isinstance(prompt_or_messages, list)
        else prompt_or_messages
    )

    config = {}
    if temperature is not None:
        config["temperature"] = temperature
    if max_output_tokens is not None:
        config["max_output_tokens"] = max_output_tokens

    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config or None,
        )
    except Exception as e:
        raise Exception(f"Error in getting response from Gemini: {str(e)}")

    text = _extract_text(response)
    if not text:
        raise ValueError("Gemini returned an empty response")
    return TextResponse(output_text=text)


def generate_json(prompt_or_messages, schema, model=DEFAULT_GEMINI_MODEL, temperature=0.0, max_output_tokens=None):
    client = initialize_gemini_client()
    contents = (
        _format_messages_as_prompt(prompt_or_messages)
        if isinstance(prompt_or_messages, list)
        else prompt_or_messages
    )

    config = {
        "temperature": temperature,
        "response_mime_type": "application/json",
        "response_json_schema": schema,
    }
    if max_output_tokens is not None:
        config["max_output_tokens"] = max_output_tokens

    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
    except Exception as e:
        raise Exception(f"Error in getting structured response from Gemini: {str(e)}")

    text = _extract_text(response)
    if not text:
        raise ValueError("Gemini returned an empty structured response")

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in model response: {text[:200]}...") from e


def moded_query(text, mode, user_id, topic_id):
    context = []
    i = 1
    try:
        if mode == "0":
            mini_rag_results = query(text, user_id, 2)
            filtered_rag = [doc for doc in mini_rag_results if doc.get("metadata", {}).get("topic_id") == topic_id]
            for doc in filtered_rag:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
            academic_rag_results = query(text, "gfg", 2)
            for doc in academic_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
        elif mode == "1":
            dev_rag_results = query(text, "dev", 3)
            for doc in dev_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
            openai_rag_results = query(text, "openai-ref", 3)
            for doc in openai_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
        elif mode == "2":
            mega_rag_results = query(text, "gfg", 3)
            for doc in mega_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
        elif mode == "4":
            last_minute_rag_results = query(text, "gfg", 3)
            for doc in last_minute_rag_results:
                content = doc.get("content", "")
                context.append({"role": "system", "content": f"[RAG #{i}] {content}"})
                i += 1
    except Exception as e:
        raise Exception(f"Error in querying data from pinecone: {str(e)}")
    return context


def get_response(input, max_tokens=-1, temp=-1, model=DEFAULT_GEMINI_MODEL):
    temperature = None if temp == -1 else temp
    max_output_tokens = None if max_tokens == -1 else max_tokens
    return generate_text(
        prompt_or_messages=input,
        model=model,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
    )


def noteGenerator(context, model=DEFAULT_GEMINI_MODEL):
    schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "introduction": {"type": "string"},
            "core_concepts": {
                "type": "array",
                "items": {"type": "string"},
            },
            "example_or_use_case": {"type": "string"},
            "common_confusions": {
                "type": "array",
                "items": {"type": "string"},
            },
            "memory_tips": {"type": "string"},
        },
        "required": [
            "title",
            "introduction",
            "core_concepts",
            "example_or_use_case",
            "common_confusions",
            "memory_tips",
        ],
        "additionalProperties": False,
    }
    return generate_json(context, schema=schema, model=model)


def flashcardGenerator(context, model=DEFAULT_GEMINI_MODEL):
    schema = {
        "type": "object",
        "properties": {
            "topic": {"type": "string"},
            "flashcards": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "concept": {"type": "string"},
                        "explanation": {"type": "string"},
                        "color": {"type": "string", "enum": ["red", "yellow", "green"]},
                    },
                    "required": ["concept", "explanation", "color"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["topic", "flashcards"],
        "additionalProperties": False,
    }
    return generate_json(context, schema=schema, model=model)


def quizGenerator(context, model=DEFAULT_GEMINI_MODEL):
    schema = {
        "type": "object",
        "properties": {
            "topic": {"type": "string"},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "answer": {"type": "string"},
                        "color": {"type": "string", "enum": ["green", "yellow", "red"]},
                    },
                    "required": ["question", "answer", "color"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["topic", "questions"],
        "additionalProperties": False,
    }
    return generate_json(context, schema=schema, model=model)


def summarize(client, text):
    prompt = [
        {
            "role": "developer",
            "content": (
                "You are a text summarizer. I will give you a conversation between an LLM and a user. "
                "Summarize it so the summary can be reused as prompt context for the model."
            ),
        },
        {"role": "user", "content": text},
    ]
    return generate_text(prompt_or_messages=prompt, model=DEFAULT_GEMINI_MODEL, temperature=0.5)


def get_pdf_text(file):
    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted
        return text
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")
