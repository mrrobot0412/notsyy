# Notsy Improvement Plan

This document captures the major improvements needed to move the application from prototype to reliable product. Priorities are grouped by impact and by area: AI, backend, frontend, Docker/deployment, security, testing, and developer experience.

## Highest Priority

- [ ] Stabilize cross-service API contracts. Define one shared contract for chat, upload, notes, flashcards, graph, and resource responses so frontend, Express, and Django agree on request fields, response shapes, IDs, and error formats.
- [ ] Fix incomplete product flows. The frontend calls `GET /chat/history/:resourceId`, but the backend only exposes `POST /chat`; PDF resources are currently routed through the video viewer; quiz endpoints exist in Django but are not fully wired as a product flow.
- [ ] Enforce user ownership everywhere. Replace broad `findById` reads with user-scoped queries for notebooks, topics, resources, chats, notes, flashcards, and graph data to prevent cross-user access.
- [ ] Add request validation at service boundaries. Validate Express request bodies with a schema library such as `zod` or `joi`, and validate Django API payloads with serializers instead of ad hoc checks.
- [ ] Add end-to-end smoke tests for the main journey: register/login, create notebook, create topic, upload resource, chat, generate notes, generate flashcards, and view resource.

## AI And RAG

- [ ] Add AI dependency health checks for Gemini, Pinecone, Redis, and the Django service itself.
- [ ] Make ingestion asynchronous. PDF/video ingestion and embedding can exceed normal HTTP request timing; move long-running work into a job queue and return processing status to the frontend.
- [ ] Improve retrieval quality. Standardize chunking, metadata fields, topic/user filters, top-k strategy, reranking, and fallback behavior when retrieval returns weak or empty results.
- [ ] Add prompt/version management. Store prompts and mode definitions in versioned configuration, with tests for each chat mode and generation task.
- [ ] Add structured AI observability. Log request IDs, topic/resource/user IDs, retrieval count, model used, latency, token usage where available, and upstream failures.
- [ ] Add timeout, retry, and circuit-breaker behavior around model and vector database calls.
- [ ] Harden uploaded content handling. Validate PDF size/page limits, sanitize extracted text, reject unsupported files, and protect against very large transcripts.
- [ ] Return citations or source references from RAG responses so users can verify generated answers.
- [ ] Decide product ownership of graph and quiz features. Either fully integrate them in the UI and persistence model or remove unused endpoints until needed.

## Backend

- [ ] Add centralized Express error middleware and remove repeated controller-level response handling.
- [ ] Normalize environment variables. Use one JWT secret name, one AI service URL name, one CORS origin strategy, and fail fast when required variables are missing.
- [ ] Standardize response envelopes. Use consistent `data`, `message`, and `error` fields across all routes.
- [ ] Move business logic out of controllers into service modules for auth, folders, topics, resources, chat, notes, flashcards, upload, and graph operations.
- [ ] Add pagination and limits for growing collections such as chat messages, resources, folders, topics, and graph nodes.
- [ ] Add MongoDB indexes for common lookups: user-owned folders, notebook topics, topic resources, resource chats, and generated study assets.
- [ ] Add cascade deletion rules and tests so deleting a notebook/topic/resource cleans dependent resources consistently.
- [ ] Replace debug `console.log` calls with structured logging and request IDs.
- [ ] Review upload storage. Local `Backend/uploads` works for development, but production should use object storage or a mounted persistent volume with lifecycle rules.
- [ ] Remove unused dependencies and stale code paths, especially old OpenAI/PDF/browser dependencies if the current AI flow no longer needs them.

## Frontend

- [ ] Introduce a server-state layer such as TanStack Query or SWR for caching, invalidation, retries, loading states, and mutation handling.
- [ ] Add consistent loading, empty, error, and retry states across dashboard, notebook, topic, resource, chat, notes, and flashcards pages.
- [ ] Split resource rendering by type. Route PDFs to the PDF viewer, videos to the video/transcript viewer, and future resource types through explicit components.
- [ ] Align chat UI with backend support. Either implement chat history and branching end-to-end or simplify the frontend to the currently supported model.
- [ ] Improve long-running task UX. Show upload/ingestion/generation progress, pending states, and clear failure messages for AI operations.
- [ ] Standardize API service modules and error handling. Avoid repeated `try/catch` patterns and normalize toast messages.
- [ ] Remove excessive production logging and stale mock/unused code.
- [ ] Improve graph performance for larger datasets through lazy loading, node limits, layout caching, and better graph interaction states.
- [ ] Revisit auth token storage. `localStorage` is simple but vulnerable to XSS; consider httpOnly cookies if the deployment model supports it.
- [ ] Add accessibility and responsive QA for modals, keyboard navigation, focus management, PDF viewing, graph controls, and form errors.

## Docker And Deployment

- [ ] Add health checks to Compose services for frontend, backend, AI, MongoDB, and Redis.
- [ ] Use readiness-aware startup. `depends_on` starts containers but does not guarantee MongoDB, Redis, or AI dependencies are ready.
- [ ] Add a root `.env.example` documenting all service variables and how they map into each container.
- [ ] Separate local and production Docker behavior clearly. Development can use Vite and Django runserver; production should use Nginx, Gunicorn, non-debug Django, and locked origins.
- [ ] Add non-root users to application containers and reduce image permissions.
- [ ] Optimize image size. Review heavy backend Chromium/Puppeteer dependencies and Python build dependencies; use multi-stage builds where useful.
- [ ] Persist and back up critical state: MongoDB data, uploaded files, and vector database/index data.
- [ ] Add reverse proxy rules for production so the frontend can use relative API paths without hardcoded localhost URLs.
- [ ] Add container logs and metrics strategy suitable for deployment.

## Security

- [ ] Keep secrets out of source and require strong values in production: JWT secret, Django secret, Gemini key, Pinecone key, database URLs.
- [ ] Disable Django `DEBUG` in production and configure `ALLOWED_HOSTS`, CORS, CSRF, secure cookies, and proxy headers correctly.
- [ ] Protect the Django AI service. It currently allows open access by default; keep it private to the backend network or add service authentication.
- [ ] Add rate limiting for auth, upload, chat, and generation endpoints.
- [ ] Add file validation for MIME type, extension, size, page count, and malware scanning if public uploads are supported.
- [ ] Sanitize model outputs before rendering markdown or generated content in the browser.
- [ ] Add audit logging for sensitive actions such as login, upload, deletion, and AI generation.

## Testing And Quality

- [ ] Add backend route tests for auth, folders, topics, resources, uploads, chat, notes, and flashcards.
- [ ] Add Django tests for validation, RAG query behavior, upload ingestion, generation endpoints, and failure cases.
- [ ] Add frontend tests for protected routes, auth forms, dashboard flows, upload flows, resource rendering, chat, notes, and flashcards.
- [ ] Add contract tests between frontend, Express, and Django to catch field-name mismatches such as `mode` vs `modeId`.
- [ ] Add lint, format, build, and test scripts at the repo root.
- [ ] Add CI to run frontend lint/build, backend tests, Django tests, and Docker build checks.

## Developer Experience

- [ ] Add a single root command for common tasks: install, dev, test, lint, build, and compose up/down.
- [ ] Add API documentation for Express and Django endpoints, including example payloads.
- [ ] Add an architecture diagram showing frontend, backend, AI service, MongoDB, Redis, vector DB, and upload storage.
- [ ] Document known local setup issues, required external credentials, and how to seed or restore AI knowledge-base data.
- [ ] Add conventional naming across routes, models, services, and frontend modules.

## Suggested Execution Order

1. Fix broken contracts and incomplete product flows.
2. Lock down ownership checks, secrets, CORS, and Django service access.
3. Add request validation, error middleware, and consistent response shapes.
4. Stabilize AI ingestion/retrieval with health checks, retries, and async jobs.
5. Improve frontend server state, loading/error states, and resource-specific views.
6. Add smoke tests, contract tests, and CI.
7. Harden Docker images, deployment configuration, observability, and backups.
