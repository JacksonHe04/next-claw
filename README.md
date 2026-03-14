# Lobster Agent Backend (Next.js V1)

Lobster is JinCheng He's recruiter-facing AI agent.

## Scope (V1)

- Workspace memory from markdown files
- Context injection
- LLM chat runtime
- `POST /api/chat`
- Minimal retro terminal-style web chat UI

No database, no vector search, no analytics, no tools.

## Project Structure

```txt
lobster-agent/
  agent/
    runtime.ts
    context.ts
    memory.ts
    prompt.ts
    model.ts
  workspace/
    identity.md
    worldview.md
    resume.md
    projects.md
    personality.md
    faq.md
  api/
    chat.ts
  app/
    api/chat/route.ts
    layout.tsx
    page.tsx
    globals.css
  config/agent.config.ts
```

## Setup (pnpm)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Build

```bash
pnpm typecheck
pnpm build
pnpm start
```

## Env

Use `.env.example` as reference.

Required key depends on `LOBSTER_PROVIDER`:

- `openai` -> `OPENAI_API_KEY`
- `anthropic` -> `ANTHROPIC_API_KEY`
- `openrouter` -> `OPENROUTER_API_KEY`

Optional (OpenAI only):

- `OPENAI_BASE_URL`

Optional:

- `LOBSTER_WORKSPACE_DIR` (default auto-detects `./workspace`)
- `LOBSTER_MODEL`
- `LOBSTER_TEMPERATURE`
- `LOBSTER_MAX_TOKENS`

## API

`POST /api/chat`

Request:

```json
{
  "message": "Why should we hire JinCheng?"
}
```

Response:

```json
{
  "reply": "..."
}
```
