
# Notsy Monorepo Summary

## What This Repository Contains

This repository is a local multi-service study assistant platform with three main parts:

1. `Frontend/`
   React 19 + Vite single-page app for authentication, notebook/topic navigation, resource viewing, graph views, chat, revision notes, and flashcards.

2. `Backend/`
   Node.js + Express + MongoDB API for users, notebooks, topics, resources, uploads, chat persistence, revision notes, and flashcards.

3. `notsy/`
   Django REST service that handles AI/RAG-style tasks such as chat responses, notes, flashcards, quizzes, graph generation, and document/video ingestion.

## High-Level Architecture

- The frontend talks to the backend at `http://localhost:3000/notsy`.
- The backend serves uploads from `/uploads`, authenticates users with JWT, stores application data in MongoDB, and proxies AI-heavy work to Django.
- The Django service listens on `http://127.0.0.1:8000` and is called by the backend for:
  - chat replies
  - PDF/video ingestion
  - notes generation
  - flashcard generation
  - graph-related AI endpoints
- Django AI utilities depend on OpenAI and Pinecone, and also expect local CSV knowledge-base files inside `notsy/ai/`.

## Main Product Flows

- Users register/login through the backend.
- Users create notebooks (`folder`) and topics.
- Users upload PDFs or YouTube URLs to a topic.
- The backend stores resource metadata in MongoDB and forwards resource content to Django for ingestion.
- Topic chat sends messages to the backend, which loads chat history, forwards context to Django, and persists the assistant response.
- Revision notes and flashcards are generated from stored chat context plus retrieved content.

## Important Runtime Details

- Frontend base API URL is hardcoded in [Frontend/src/utils/axios.js](/Users/amankapoor/notsyy/Frontend/src/utils/axios.js:1) as `http://localhost:3000/notsy`.
- Backend port is hardcoded in [Backend/app.js](/Users/amankapoor/notsyy/Backend/app.js:1) as `3000`.
- Backend CORS only allows `http://localhost:5173`.
- Backend expects MongoDB via `MONGO_URI`.
- JWT env naming is inconsistent:
  - token creation uses `JWT_SECRET` and `JWT_LIFETIME` in [Backend/models/user.js](/Users/amankapoor/notsyy/Backend/models/user.js:1)
  - auth verification uses `jwt_secret` in [Backend/middlewares/authenticate.js](/Users/amankapoor/notsyy/Backend/middlewares/authenticate.js:1)
  - for local development, set both `JWT_SECRET` and `jwt_secret` to the same value.
- Django uses SQLite for its own app DB and Redis cache at `redis://127.0.0.1:6379/1`.
- Django AI code expects these local files, but they are currently missing from the repo:
  - `notsy/ai/openai_docs_chunked.csv`
  - `notsy/ai/gfg_cleaned.csv`

## Codebase Summary

### Frontend

- Router-driven SPA with public landing/auth pages and protected dashboard routes.
- Main route groups:
  - `/`
  - `/auth/login`
  - `/auth/register`
  - `/dashboard`
  - `/dashboard/notebook/:notebookId`
  - `/dashboard/topic/:topicId`
  - `/dashboard/resource/:resourceId`
  - `/dashboard/graph-view`
- Auth state is token-based and stored in `localStorage`.
- Service modules wrap API calls for chat, uploads, notes, flashcards, and resources.

### Backend

- Express app with route groups under `/notsy`.
- Major route areas:
  - `/auth`
  - `/folder`
  - `/topic`
  - `/upload`
  - `/resource`
  - `/chat`
  - `/revisionNotes`
  - `/flashcards`
- Mongoose models cover users, notebooks/folders, topics, resources, chats, flashcards, revision notes, and graph data.
- Upload flow stores static files under `Backend/uploads`.
- Some controllers still contain debug logging and a few route/controller assumptions look brittle, but the overall structure is coherent.

### Django AI Service

- DRF API mounted at `/`.
- Notable endpoints:
  - `/respond/`
  - `/upload/`
  - `/querry/`
  - `/moded_query/`
  - `/notes/`
  - `/cards/`
  - `/quiz/`
  - `/graph/`
  - `/add_node/`
- `ai/utils.py` centralizes OpenAI calls, Pinecone queries, PDF parsing, embeddings, and chunking.
- This service is the most operationally sensitive part of the stack because it depends on OpenAI, Pinecone, Redis, and missing CSV assets.

## Prerequisites

- Node.js 18+
- npm
- Python 3.11+ recommended
- MongoDB running locally or remotely
- Redis on `127.0.0.1:6379`
- OpenAI credentials
- Pinecone credentials

## Suggested Environment Files

### `Backend/.env`

```env
MONGO_URI=mongodb://127.0.0.1:27017/notsy
JWT_SECRET=replace-me
jwt_secret=replace-me
JWT_LIFETIME=7d
OPENAI_API_KEY=replace-me
OPENAI_ORG_ID=
OPENAI_PROJECT_ID=
NODE_ENV=development
```

### `notsy/.env`

```env
OPENAI_API_KEY=replace-me
OPENAI_ORG_KEY=
OPENAI_PROJECT_ID=
PINE_API_KEY=replace-me
PINE_HOST=replace-me
```

## How To Run The Full Project

Open three terminals from the repository root.

### 1. Start Django AI service

```bash
cd notsy
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Start the backend API

```bash
cd Backend
npm install
node app.js
```

### 3. Start the frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend should then be available at `http://localhost:5173`.

## Current Startup Risks

- The Django service will fail on import unless the missing CSV files are restored or the code is changed to handle their absence.
- The backend will fail if `MONGO_URI` is missing or MongoDB is unreachable.
- AI-assisted features will fail unless OpenAI and Pinecone env vars are valid.
- Some backend auth flows can fail if `JWT_SECRET` and `jwt_secret` are not aligned.
- Redis is configured in Django and may be required depending on code paths and installed middleware behavior.

## Recommended Next Fixes

1. Add a root orchestration script or `docker-compose.yml`.
2. Normalize env variable names, especially JWT and OpenAI org keys.
3. Move hardcoded service URLs into environment variables.
4. Restore or version the missing CSV assets required by `notsy/ai/utils.py`.
5. Add health endpoints and a short smoke-test section.
