from dataclasses import dataclass
import json
import os
import time
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
DEFAULT_GEMINI_FALLBACK_MODELS = [
    model.strip()
    for model in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-2.5-flash-lite").split(",")
    if model.strip()
]
RAG_CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "3500"))
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "500"))
RAG_MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "18000"))


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


def _is_retryable_gemini_error(error):
    message = str(error).upper()
    retry_markers = [
        "503",
        "UNAVAILABLE",
        "RESOURCE_EXHAUSTED",
        "DEADLINE_EXCEEDED",
        "INTERNAL",
    ]
    return any(marker in message for marker in retry_markers)


def _generate_with_retry(client, *, model, contents, config, max_attempts=4):
    last_error = None

    for attempt in range(max_attempts):
        try:
            return client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
        except Exception as e:
            last_error = e
            if not _is_retryable_gemini_error(e) or attempt == max_attempts - 1:
                raise
            time.sleep(2 ** attempt)

    raise last_error


def _generate_across_models(client, *, model, contents, config):
    models_to_try = []

    for candidate in [model, *DEFAULT_GEMINI_FALLBACK_MODELS]:
        if candidate not in models_to_try:
            models_to_try.append(candidate)

    last_error = None

    for candidate in models_to_try:
        try:
            return _generate_with_retry(
                client,
                model=candidate,
                contents=contents,
                config=config,
            )
        except Exception as e:
            last_error = e
            if not _is_retryable_gemini_error(e):
                raise

    raise last_error


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
    result = client.models.embed_content(
        model=model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=768,
            title=title,
        ),
    )

    if not result.embeddings:
        raise ValueError("Gemini returned no embedding")

    return result.embeddings[0].values


def create_chunks(text):
    normalized_text = (text or "").strip()
    if not normalized_text:
        return []

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=RAG_CHUNK_SIZE,
        chunk_overlap=RAG_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
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

    for chunk_index, chunk in enumerate(chunks):
        try:
            unique_id = str(uuid.uuid4())
            chunk_metadata = {
                **metadata,
                "text": chunk,
                "chunk_index": chunk_index,
                "chunk_count": len(chunks),
            }
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


def query(text, namespace, top_k, filter_metadata=None):
    threshold = 0.0
    index = initialize_pincone()

    data_chunks = create_chunks(text)
    if not data_chunks:
        raise ValueError("No chunks returned from the input text. Check 'create_chunks()' logic.")
    data = data_chunks[0]

    vector = get_embedding(
        client=initialize_gemini_client(),
        text=data,
        model=DEFAULT_GEMINI_EMBED_MODEL,
        task_type="RETRIEVAL_QUERY",
    )

    query_kwargs = {
        "vector": vector,
        "top_k": top_k,
        "include_metadata": True,
        "namespace": namespace,
    }
    if filter_metadata:
        query_kwargs["filter"] = filter_metadata

    answer = index.query(**query_kwargs)

    result = []
    matches = answer.get("matches", []) if isinstance(answer, dict) else getattr(answer, "matches", [])
    if not matches:
        return result

    for match in matches:
        score = match.get("score", 0) if isinstance(match, dict) else getattr(match, "score", 0)
        if score < threshold:
            continue

        metadata = match.get("metadata", {}) if isinstance(match, dict) else getattr(match, "metadata", {})
        match_id = match.get("id") if isinstance(match, dict) else getattr(match, "id", None)
        if namespace == "openai-ref":
            content_row = OPENAI_DF[OPENAI_DF["id"] == match_id]
            if content_row.empty:
                continue
            content = content_row["text"].values[0]
            result.append({"content": content, "metadata": metadata, "score": score, "id": match_id})
        elif namespace == "gfg":
            url = metadata.get("url")
            content_row = GFG_DF[GFG_DF["url"] == url]
            if content_row.empty:
                continue
            content = content_row["text"].values[0]
            result.append({"content": content, "metadata": metadata, "score": score, "id": match_id})
        else:
            content = metadata.get("text", "")
            result.append({"content": content, "metadata": metadata, "score": score, "id": match_id})

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
        response = _generate_across_models(
            client,
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
        response = _generate_across_models(
            client,
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


def _append_rag_context(context, docs, start_index=1, max_chars=RAG_MAX_CONTEXT_CHARS):
    next_index = start_index
    used_chars = 0
    sources = []

    for doc in docs:
        content = (doc.get("content") or "").strip()
        if not content:
            continue

        remaining = max_chars - used_chars
        if remaining <= 0:
            break

        content = content[:remaining]
        metadata = doc.get("metadata", {})
        source = metadata.get("filename") or metadata.get("url") or metadata.get("source") or "retrieved document"
        chunk_index = metadata.get("chunk_index")
        chunk_count = metadata.get("chunk_count")
        source_label = source
        if chunk_index is not None and chunk_count is not None:
            source_label = f"{source} chunk {int(chunk_index) + 1}/{chunk_count}"

        context.append(
            {
                "role": "system",
                "content": f"[RAG #{next_index} | source: {source_label}]\n{content}",
            }
        )
        sources.append(
            {
                "rag_index": next_index,
                "source": source,
                "chunk_index": chunk_index,
                "chunk_count": chunk_count,
                "score": doc.get("score"),
            }
        )
        used_chars += len(content)
        next_index += 1

    return next_index, sources


def moded_query(text, mode, user_id, topic_id):
    context = []
    sources = []
    i = 1

    def append_user_topic_docs(top_k=6):
        if not user_id or not topic_id:
            return i, []
        user_rag_results = query(
            text,
            user_id,
            top_k,
            filter_metadata={"topic_id": {"$eq": topic_id}},
        )
        return _append_rag_context(context, user_rag_results, i)

    try:
        if mode == "0":
            i, mini_sources = append_user_topic_docs(6)
            sources.extend(mini_sources)

            academic_rag_results = query(text, "gfg", 2)
            i, academic_sources = _append_rag_context(context, academic_rag_results, i)
            sources.extend(academic_sources)
        elif mode == "1":
            dev_rag_results = query(text, "dev", 3)
            i, dev_sources = _append_rag_context(context, dev_rag_results, i)
            sources.extend(dev_sources)

            openai_rag_results = query(text, "openai-ref", 3)
            i, openai_sources = _append_rag_context(context, openai_rag_results, i)
            sources.extend(openai_sources)
        elif mode == "2":
            mega_rag_results = query(text, "gfg", 3)
            i, mega_sources = _append_rag_context(context, mega_rag_results, i)
            sources.extend(mega_sources)
        elif mode == "3":
            i, exploratory_sources = append_user_topic_docs(6)
            sources.extend(exploratory_sources)
        elif mode == "4":
            i, mini_sources = append_user_topic_docs(6)
            sources.extend(mini_sources)

            last_minute_rag_results = query(text, "gfg", 3)
            i, last_minute_sources = _append_rag_context(context, last_minute_rag_results, i)
            sources.extend(last_minute_sources)
        elif mode == "5":
            i, mastery_sources = append_user_topic_docs(8)
            sources.extend(mastery_sources)
    except Exception as e:
        raise Exception(f"Error in querying data from pinecone: {str(e)}")
    return {"context": context, "sources": sources}


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
                "items": {
                    "type": "string",
                    "description": "Detailed explanation of core concept of the topic",
                },
            },
            "example_or_use_case": {
                "type": "string",
                "description": "Example or use case of the topic, Fill it only if you some good examples otherwise leave it empty",
            },
            "common_confusions": {
                "type": "array",
                "items": {
                    "type": "string",
                    "description": "Common confusions/pitfalls students fall into, Fill it only if you something important otherwise leave it empty",
                },
            },
            "memory_tips": {
                "type": "string",
                "description": "Memory tips to remember the topic, Fill it only if you some good tip otherwise leave it empty",
            },
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
                        "concept": {
                            "type": "string",
                            "description": "A concise fact, formula, or concept relevant to the topic",
                        },
                        "explanation": {
                            "type": "string",
                            "description": "A short explanation, use-case, or memory aid for the concept",
                        },
                        "color": {
                            "type": "string",
                            "enum": ["red", "yellow", "green"],
                            "description": "Importance level: red = critical, yellow = important, green = regular",
                        },
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
                        "question": {
                            "type": "string",
                            "description": "A single multiple-choice or short-answer style question that tests knowledge of the topic",
                        },
                        "answer": {
                            "type": "string",
                            "description": "The correct answer or explanation",
                        },
                        "color": {
                            "type": "string",
                            "enum": ["green", "yellow", "red"],
                            "description": "Difficulty level: green = easy, yellow = medium, red = hard/tricky",
                        },
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
                "You are an Text Summarizer, I will give you a conversation between an llm and a user, "
                "you need to summarize the conversation such that the summary can be used as a prompt for "
                "the llm. You must do it in a chat format so that the summary reflects the doubts of the "
                "user and solutions provided by the llm."
            ),
        },
        {
            "role": "user",
            "content": text,
        },
    ]
    return generate_text(
        prompt_or_messages=prompt,
        model=DEFAULT_GEMINI_MODEL,
        temperature=0.5,
        max_output_tokens=5000,
    )


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
