# Notsy AI + RAG System Documentation

## 1. Why This System Exists

Notsy is a study assistant built around a simple product goal: turn static learning material into an interactive, personalized study workflow.

The AI system exists to solve five problems:

1. Let a student chat with their own material instead of reading it passively.
2. Ground answers in topic-specific resources instead of relying only on model priors.
3. Convert long-form material into study artifacts such as notes, flashcards, and quizzes.
4. Support different interaction modes depending on user intent: balanced learning, developer/documentation help, last-minute revision, and guided teaching.
5. Organize concepts into graph structures that can be visualized and navigated.

This is not a single-model chatbot. It is a multi-service pipeline where:

- the frontend provides the UX,
- the Node/Express backend handles user auth, storage, uploads, and app state,
- the Django AI service performs ingestion, retrieval, generation, structured outputs, and graph construction,
- Pinecone stores embeddings,
- Gemini handles both embeddings and generation.

## 2. System Architecture

### 2.1 High-Level Components

The project is split into three main runtime services:

1. `Frontend/`
   React/Vite application for notebooks, topics, resource viewers, chat, notes, flashcards, and graph views.

2. `Backend/`
   Node.js + Express application that:
   - authenticates users,
   - stores product state in MongoDB,
   - persists chats/resources/generated artifacts,
   - proxies AI-heavy requests to the Django service.

3. `notsy/`
   Django REST AI service that:
   - embeds content,
   - chunks and upserts content into Pinecone,
   - retrieves context,
   - calls Gemini for free-form and structured generation,
   - parses PDFs,
   - generates graph adjacency lists.

Supporting infrastructure:

- `MongoDB` for application persistence
- `Redis` configured for Django caching
- `Pinecone` as the vector database
- `Gemini` as both the generation model and embedding model

`docker-compose.yml` wires these services together for local deployment.

## 3. Separation Of Responsibilities

### 3.1 Frontend Responsibilities

The frontend is responsible for:

- collecting user prompts,
- selecting the chat mode,
- uploading PDFs,
- adding YouTube resources,
- displaying generated notes/flashcards,
- rendering the graph UI.

The mode selector is defined in [Frontend/src/constants/chatModes.js](/Users/amankapoor/notsyy/Frontend/src/constants/chatModes.js:1).

### 3.2 Backend Responsibilities

The backend is the product-facing orchestration layer.

It is responsible for:

- JWT authentication
- notebook/topic/resource/chat persistence
- storing uploaded resource metadata
- scraping YouTube transcripts
- calling the AI service with the right topic/user context
- storing generated notes and flashcards back into MongoDB

Relevant files:

- [Backend/app.js](/Users/amankapoor/notsyy/Backend/app.js:1)
- [Backend/controllers/chat.js](/Users/amankapoor/notsyy/Backend/controllers/chat.js:91)
- [Backend/controllers/topic/upload.js](/Users/amankapoor/notsyy/Backend/controllers/topic/upload.js:12)
- [Backend/controllers/topic/revisionNotes.js](/Users/amankapoor/notsyy/Backend/controllers/topic/revisionNotes.js:40)
- [Backend/controllers/topic/flashcards.js](/Users/amankapoor/notsyy/Backend/controllers/topic/flashcards.js:41)

### 3.3 Django AI Service Responsibilities

The AI service is where almost all AI logic lives.

Its responsibilities are:

- loading Gemini + Pinecone clients,
- embedding text,
- chunking documents,
- storing vectors by namespace,
- retrieving context by mode,
- generating free-form answers,
- generating schema-constrained JSON outputs,
- parsing PDFs into text,
- producing graph connections between topics.

Core files:

- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:1)
- [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:15)
- [notsy/ai/urls.py](/Users/amankapoor/notsyy/notsy/ai/urls.py:1)

## 4. AI Tech Stack

The AI stack currently implemented in code is:

- `Gemini 2.5 Flash` for main generation by default
- `gemini-2.5-flash-lite` as fallback model by default
- `gemini-embedding-001` for embeddings
- `Pinecone` for vector storage and similarity search
- `LangChain RecursiveCharacterTextSplitter` for chunking
- `PyPDF2` for PDF text extraction
- `Django REST Framework` for AI service endpoints

This is configured in:

- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:17)
- [notsy/.env.example](/Users/amankapoor/notsyy/notsy/.env.example:1)
- [notsy/requirements.txt](/Users/amankapoor/notsyy/notsy/requirements.txt:1)

## 5. Core Data Model Behind The AI System

### 5.1 User Resources

The system supports two resource types:

- YouTube videos
- PDFs

These are stored in MongoDB as `Resource` documents with:

- `type`
- `source`
- `content`
- `topicId`
- `userId`

See [Backend/models/topic/resources.js](/Users/amankapoor/notsyy/Backend/models/topic/resources.js:1).

### 5.2 Chats

Chats are persisted as message arrays with optional branching through `parentChatId`.

The chat model stores:

- `topicId`
- `resourceId`
- `userId`
- `parentChatId`
- `messages`
- `summary`
- `modeId`

See [Backend/models/topic/chat.js](/Users/amankapoor/notsyy/Backend/models/topic/chat.js:1).

### 5.3 Generated Study Artifacts

Generated AI outputs are stored separately:

- revision notes in `RevisionNotes`
- flashcards in `Flashcard`

See:

- [Backend/models/topic/revisionNotes.js](/Users/amankapoor/notsyy/Backend/models/topic/revisionNotes.js:1)
- [Backend/models/topic/flashcards.js](/Users/amankapoor/notsyy/Backend/models/topic/flashcards.js:1)

## 6. End-To-End AI Pipeline

This section describes the actual pipeline from ingestion to answer generation.

### 6.1 Resource Ingestion

#### Video ingestion

Video ingestion works like this:

1. The frontend sends a YouTube URL to the backend.
2. The backend scrapes the transcript using Puppeteer with a stealth plugin.
3. The transcript is stored as a `Resource` in MongoDB.
4. The transcript text is forwarded to the Django AI service.
5. The AI service chunks and embeds the transcript.
6. The embeddings are stored in Pinecone under the namespace equal to the `userId`.

Code path:

- [Backend/controllers/topic/upload.js](/Users/amankapoor/notsyy/Backend/controllers/topic/upload.js:12)
- [Backend/services/scrapeTranscript.js](/Users/amankapoor/notsyy/Backend/services/scrapeTranscript.js:1)
- [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:242)
- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:153)

#### PDF ingestion

PDF ingestion works like this:

1. The frontend uploads one or more PDFs to the backend.
2. The backend stores file metadata and streams the actual files to Django.
3. Django extracts raw text using `PyPDF2`.
4. The extracted text is chunked and embedded.
5. The vectors are stored in Pinecone under the `userId` namespace.

Code path:

- [Backend/controllers/topic/upload.js](/Users/amankapoor/notsyy/Backend/controllers/topic/upload.js:101)
- [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:255)
- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:486)

### 6.2 Chunking Strategy

The system uses `RecursiveCharacterTextSplitter` with:

- `chunk_size = 24000`
- `chunk_overlap = 500`

This is implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:138).

Important observation: this chunk size is very large by typical RAG standards. In practice, this means:

- fewer chunks per document,
- lower indexing overhead,
- more context per chunk,
- but weaker retrieval granularity,
- and a higher chance of semantically mixed chunks.

This is a pragmatic early-stage choice, not a highly optimized retrieval strategy.

### 6.3 Embedding Strategy

Embeddings are generated with Gemini embedding models using two task types:

- `RETRIEVAL_DOCUMENT` for stored content
- `RETRIEVAL_QUERY` for search queries

The embedding dimensionality is explicitly set to `768`.

This is implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:119).

### 6.4 Vector Storage Strategy

The vector DB strategy is namespace-based.

Namespaces used in practice:

- `userId` for private user-ingested content
- `gfg` for a shared academic corpus
- `dev` for a shared developer corpus
- `openai-ref` for a shared OpenAI/reference corpus

The system stores user-private vectors in the user namespace and queries shared namespaces depending on mode.

This gives the system a useful split:

- personal context is isolated per user,
- common reference material is shared.

### 6.5 Retrieval Strategy

Retrieval is mode-specific through `moded_query(...)` in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:337).

#### Mode 0: Balanced Mode

Retrieves:

- top 2 results from the user namespace
- top 2 results from `gfg`

The user results are filtered by `topic_id`, which is important because a single user namespace may contain vectors from multiple topics.

#### Mode 1: Dev Mode

Retrieves:

- top 3 from `dev`
- top 3 from `openai-ref`

This mode is aimed at coding/documentation-heavy answers.

#### Mode 4: Last Minute Mode

Retrieves:

- top 3 from `gfg`

This is a compressed, exam-oriented retrieval path.

#### Mode 5: Master This

This mode does not have a dedicated retrieval branch in `moded_query`.
Instead, it relies on:

- the base chat context,
- optional raw video transcript content,
- optional raw PDF content attached directly to the request.

However, in the current backend chat flow, those raw `video` and `pdf` fields are not forwarded for ordinary chat requests. That means the implemented behavior is weaker than the intended design.

#### Mode 3: Go Crazy

Mode 3 changes generation temperature but does not add a custom retrieval policy.

### 6.6 Prompt Construction

Prompt construction is simple and explicit rather than heavily abstracted.

For chat:

1. Start with a developer instruction based on mode.
2. Add truncated summary context.
3. Add the last 20 chat messages.
4. Add retrieved RAG snippets as `[RAG #n]`.
5. Add the current user query.

This is implemented in [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:46).

The prompt formatter converts message arrays into a text prompt of the form:

```text
ROLE:
content
```

This is implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:244).

### 6.7 Generation Strategy

For free-form text generation:

- the system calls Gemini through `generate_text(...)`
- retry logic handles transient failures
- fallback models are attempted if retryable failures continue

This is implemented in:

- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:62)
- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:81)
- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:271)

The retry methodology is:

- exponential backoff
- retry only on likely transient errors such as `503`, `UNAVAILABLE`, `RESOURCE_EXHAUSTED`, `DEADLINE_EXCEEDED`, and `INTERNAL`

This is one of the better production-minded choices in the current AI layer.

## 7. Structured Generation Methodology

One strong part of the implementation is the use of schema-constrained generation for study artifacts.

Instead of asking the model for free-form notes/cards/quizzes and then parsing loosely, the system asks Gemini for JSON matching an explicit schema.

### 7.1 Notes Generation

The notes generator returns:

- `title`
- `introduction`
- `core_concepts`
- `example_or_use_case`
- `common_confusions`
- `memory_tips`

Implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:392).

### 7.2 Flashcard Generation

The flashcard generator returns:

- `topic`
- array of flashcards
- each flashcard has `concept`, `explanation`, and `color`

Implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:422).

### 7.3 Quiz Generation

The quiz generator returns:

- `topic`
- array of questions
- each question has `question`, `answer`, and difficulty-like `color`

Implemented in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:447).

### 7.4 Why This Matters

For an applied AI discussion, this is a strong design choice because it shows:

- output contract thinking,
- better downstream reliability,
- easier persistence into MongoDB,
- lower UI breakage risk,
- less brittle post-processing.

## 8. Notes, Flashcards, And Quiz Pipeline

These generation flows follow the same general methodology:

1. Collect past chats for a topic.
2. Merge message history and stored summary arrays.
3. Retrieve a small amount of topic-relevant material from the user namespace.
4. Append an instruction asking for notes/flashcards/quiz.
5. Generate structured JSON.
6. Persist the result in MongoDB.

Notes endpoint:

- AI generation in [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:134)
- backend persistence in [Backend/controllers/topic/revisionNotes.js](/Users/amankapoor/notsyy/Backend/controllers/topic/revisionNotes.js:40)

Flashcards endpoint:

- AI generation in [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:170)
- backend persistence in [Backend/controllers/topic/flashcards.js](/Users/amankapoor/notsyy/Backend/controllers/topic/flashcards.js:41)

Quiz endpoint exists in Django:

- [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:206)

But there is no equivalent backend persistence flow wired in the same way as notes and flashcards, so quiz support is only partially integrated.

## 9. Knowledge Graph Methodology

The system also uses LLMs for graph construction.

This is not graph-RAG in the retrieval sense. It is semantic graph generation for UI organization.

### 9.1 Full Graph Generation

Given a set of topic labels, Gemini is asked to produce a labeled adjacency list where each topic connects to semantically related topics with a short reason.

Implemented in [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:329).

### 9.2 Incremental Graph Expansion

When a new node is added, Gemini is asked to connect it to the existing graph and return reasons for the edges.

Implemented in [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:379).

### 9.3 Why This Matters

This is useful in a pitch because it shows the project is not only “chat with documents”.
It applies AI in multiple interaction patterns:

- retrieval-grounded tutoring
- study artifact generation
- semantic graph structuring

## 10. Shared Reference Corpora

The system supports shared, pre-built corpora via local CSV-backed datasets:

- `openai_docs_chunked.csv`
- `gfg_cleaned.csv`

These are loaded if present using `load_optional_csv(...)` in [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:27).

Behavior matters here:

- the service does **not** crash if these CSVs are missing,
- but retrieval from `openai-ref` or `gfg` will silently return weak/no useful content if the Pinecone metadata refers to content not present in those CSVs.

This is an important operational detail.

## 11. Methodologies Used In This System

This project uses a set of practical applied-AI methodologies rather than one research-heavy framework.

### 11.1 Retrieval-Augmented Generation

Used to ground responses in:

- user-uploaded transcripts and PDFs
- shared academic references
- shared dev/documentation references

### 11.2 Hybrid Private + Shared Knowledge

The design separates:

- private user/topic knowledge
- reusable shared corpora

This is a good product methodology because users get personalization without losing broad reference coverage.

### 11.3 Mode-Based Behavior Control

The same system adapts to different intents by changing:

- developer instruction
- retrieval source selection
- temperature
- response length

This is simpler than training specialized models and faster to ship.

### 11.4 Structured Output Generation

This reduces hallucinated output shape and improves storage/UI reliability.

### 11.5 Context Window Management

Instead of sending all history, the system currently uses:

- truncated summary array,
- last 20 messages,
- a handful of retrieved chunks.

This is a classic pragmatic context-budget strategy.

### 11.6 Retry + Fallback Resilience

Gemini calls have:

- retry logic
- exponential backoff
- fallback model support

That matters for real-world latency spikes and availability issues.

## 12. Problems Faced And Current Limitations

This section is intentionally blunt. For an applied AI role, being able to explain tradeoffs and current gaps is a strength, not a weakness.

### 12.1 Summary Pipeline Is Incomplete

The chat schema contains a `summary` field and the prompt logic consumes `summary[:-2]`, but the current chat response from Django does not return a generated summary.

As a result:

- summaries are effectively empty in normal operation,
- long-term conversation compression is not really implemented yet,
- context management currently relies mostly on the last 20 messages.

Relevant files:

- [Backend/controllers/chat.js](/Users/amankapoor/notsyy/Backend/controllers/chat.js:176)
- [notsy/ai/views.py](/Users/amankapoor/notsyy/notsy/ai/views.py:83)
- [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:472)

### 12.2 Chunk Size Is Too Large For Fine-Grained Retrieval

`24000` characters is convenient but coarse.

Likely downside:

- a relevant paragraph may be buried inside a giant chunk,
- retrieval precision will degrade,
- retrieved evidence is less explainable.

### 12.3 Metadata Stores Only The First 500 Characters

For user-ingested vectors, retrieval returns `metadata["text"]`, which is only the first `500` characters of the chunk.

This means:

- the stored embedding represents the full chunk,
- but the retrieved text shown to the LLM may only be a short preview.

That weakens the grounding quality.

See [notsy/ai/utils.py](/Users/amankapoor/notsyy/notsy/ai/utils.py:168).

### 12.4 Mode Coverage Is Uneven

Defined frontend modes are:

- Balanced
- Dev Mode
- Master This
- Go Crazy
- Last Minute

But backend retrieval behavior is only explicitly implemented for some of them.

Mode `5` in particular looks conceptually richer than what the backend currently sends.

### 12.5 Query Endpoint Naming And Minor API Cleanliness Issues

There are a few signs of rapid iteration:

- `/querry/` is misspelled
- some error strings are inconsistent
- some variable names are misspelled (`temprature`, `querry`)
- some commented code remains in important controllers

These are not architectural problems, but they do show the system is still in active refinement.

### 12.6 Transcript Extraction Is Fragile By Nature

YouTube transcript scraping depends on page structure and UI selectors.

That means failures can happen due to:

- UI changes,
- cookie banners,
- transcript availability,
- anti-bot behavior.

This is a practical but brittle ingestion path.

### 12.7 Limited Evaluation Layer

There is no visible dedicated evaluation framework for:

- retrieval quality
- hallucination rate
- answer grounding
- note/flashcard usefulness
- latency/cost tracking

The system is product-functional, but not yet deeply instrumented.

### 12.8 Redis Is Configured But Not Materially Used In The Core AI Pipeline

Redis is present in Django config, but the core AI retrieval/generation flow does not appear to actively exploit caching in a meaningful, explicit way yet.

That suggests the infra is ahead of the implementation in this area.

## 13. What Is Good About This Design

If I were pitching this for an applied AI role, these are the strongest points.

### 13.1 Real Product Architecture, Not A Notebook Demo

This is a real multi-service system with:

- auth,
- persistence,
- ingestion,
- vector storage,
- generation,
- UI surfaces,
- artifact generation.

### 13.2 Clear AI/Backend Separation

AI complexity is isolated into a dedicated service instead of being scattered through the product backend.

That is a strong engineering choice.

### 13.3 Grounded Personalized Tutoring

The system does not only answer from model priors. It uses user content and topic scoping.

### 13.4 Structured Outputs

This is a very practical applied AI pattern and one of the best implementation decisions in the codebase.

### 13.5 Retrieval Modes Mapped To User Intent

Even if imperfectly implemented, the product thinking is strong:

- not every question should retrieve the same corpus,
- not every chat session should have the same generation behavior.

## 14. How I Would Explain The Approach In An Interview

The cleanest explanation is:

> We built Notsy as a multi-service applied AI system for learning. The core idea was to combine a standard app backend with a dedicated AI microservice that handles ingestion, retrieval, and generation. User resources like PDFs and YouTube transcripts are embedded with Gemini and stored in Pinecone under user-specific namespaces, while shared corpora support common academic and developer queries. At generation time, the AI service builds prompts from recent chat history plus retrieved context, then uses Gemini to answer or generate structured outputs like notes and flashcards. We also experimented with LLM-based semantic graph construction to organize topics visually. The main engineering challenges were grounding quality, context management, ingestion reliability, and keeping output formats stable enough for the product UI.

That explanation is accurate to the code and strong enough for a pitch.

## 15. Environment And Deployment Requirements

### 15.1 Backend Environment

See [Backend/.env.example](/Users/amankapoor/notsyy/Backend/.env.example:1).

Important variables:

- `MONGO_URI`
- `JWT_SECRET`
- `jwt_secret`
- `JWT_LIFETIME`
- `AI_SERVICE_URL`
- `CORS_ORIGIN`

Note: `JWT_SECRET` and `jwt_secret` are both required because token creation and token verification use different env variable names.

### 15.2 AI Service Environment

See [notsy/.env.example](/Users/amankapoor/notsyy/notsy/.env.example:1).

Important variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_FALLBACK_MODELS`
- `GEMINI_EMBED_MODEL`
- `PINE_API_KEY`
- `PINE_HOST`
- `REDIS_URL`

## 16. Future Improvements I Would Prioritize

If continuing this project seriously, these would be the highest-value next steps.

1. Implement real conversation summarization and persist it after each chat turn.
2. Reduce chunk size and add chunk metadata such as page number, resource type, and chunk index.
3. Store retrievable full chunk text or reconstruct it from a document store instead of only storing 500-character previews.
4. Add retrieval evaluation and prompt-level observability.
5. Make mode behavior explicit and complete for all frontend modes.
6. Add source attribution in responses so users can see where answers came from.
7. Cache embeddings and repeated retrieval/generation paths where useful.
8. Replace brittle transcript scraping with more robust transcript acquisition where possible.
9. Add quiz persistence and frontend integration equivalent to notes and flashcards.
10. Clean API naming and remove dead/commented code paths.

## 17. Final Summary

Notsy’s AI system is best understood as a practical applied AI platform for education rather than a pure RAG demo.

Its main strengths are:

- real product integration,
- dedicated AI orchestration service,
- user-grounded retrieval,
- shared knowledge corpora,
- structured output generation,
- multi-mode behavior,
- concept graph generation.

Its current weaknesses are:

- incomplete summary compression,
- coarse chunking,
- partial mode implementation,
- limited evaluation/observability,
- brittle transcript ingestion,
- some rough engineering edges from rapid iteration.

Overall, the project demonstrates solid applied AI instincts:

- separate orchestration from app logic,
- use retrieval to personalize and ground,
- use schemas for reliability,
- and design the AI around real user workflows instead of generic prompting alone.
