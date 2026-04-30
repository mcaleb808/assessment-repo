# MCP Agent

An MCP-driven agent: FastAPI backend wrapping the OpenAI Agents SDK + an MCP
client, with a Next.js frontend that streams tool calls and the final result
over Server-Sent Events. Both services run on Google Cloud Run.

## Architecture

```
                          ┌────────────────────────┐
                          │  GitHub Actions deploy │
                          └───────────┬────────────┘
                                      │ WIF (no JSON keys)
                                      ▼
┌────────────────┐   REST + SSE   ┌────────────────────────┐
│  Next.js (web) │ ◄────────────► │   Cloud Run (api)      │
│  Cloud Run     │                │   FastAPI + Agents SDK │
└────────────────┘                └─────────┬──────────────┘
                                            │ MCP (stdio | SSE)
                                            ▼
                                  ┌──────────────────┐
                                  │   MCP server     │
                                  └──────────────────┘

Observability:  Agents SDK @trace → LangFuse  |  structlog → Cloud Logging
```

## Repo layout

```
.
├── apps/
│   ├── api/              # FastAPI + OpenAI Agents SDK + MCP client
│   │   ├── src/
│   │   │   ├── routes/   # FastAPI routers (HTTP layer)
│   │   │   ├── services/ # orchestration glue + tracing
│   │   │   ├── agents/   # agent builder + prompts
│   │   │   ├── mcp/      # MCP transport (stdio | SSE)
│   │   │   ├── schemas/  # Pydantic request/response/event models
│   │   │   ├── middleware/ # request_id + structlog binding
│   │   │   └── utils/
│   │   └── tests/
│   └── web/              # Next.js 16 App Router + Tailwind 4 + shadcn
│       └── src/
│           ├── app/
│           ├── components/
│           ├── hooks/
│           └── lib/
├── infra/                # Terraform (Cloud Run + Artifact Registry + WIF)
├── scripts/              # list_tools.py, smoke.sh, pre_warm.sh
├── evals/                # 5-case smoke harness
├── .github/workflows/
└── docker-compose.yml
```

## Quick start

```bash
cp .env.example .env
# fill in OPENAI_API_KEY, MCP_SERVER_URL (or MCP_STDIO_COMMAND), and LangFuse keys

make dev          # runs api on :8000 and web on :3000 via docker compose
make test         # api pytest + web typecheck
```

Open http://localhost:3000.

## Configuration

All env vars are documented in `.env.example`. Most useful:

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | LLM provider key |
| `MCP_TRANSPORT` | `sse` or `stdio` |
| `MCP_SERVER_URL` | URL when `MCP_TRANSPORT=sse` |
| `MCP_STDIO_COMMAND` | Command when `MCP_TRANSPORT=stdio` |
| `STRONG_MODEL` / `FAST_MODEL` | Model routing |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | Trace export (optional) |
| `NEXT_PUBLIC_API_URL` | Frontend → backend URL |

Secrets in production are mounted from Google Secret Manager via Terraform.

## Deploy

Pushes to `main` deploy via GitHub Actions:

1. **lint-test** — ruff + pytest on api, eslint + tsc + next build on web
2. **build-push** — docker buildx push to Artifact Registry (matrix: api, web)
3. **deploy** — `deploy-cloudrun` for both services, with `NEXT_PUBLIC_API_URL`
   wired to the api's URL after that service is updated

Auth uses Workload Identity Federation — no service-account JSON key is stored
anywhere.

## Endpoints

```
GET  /health                # liveness + config status
POST /agent/run             # synchronous agent run
GET  /agent/stream?prompt=  # SSE stream of tool_call / tool_result / final
```

Frontend at `/`.

## Development tooling

```bash
make list-tools URL=https://example.com/sse   # dump MCP tool schemas
make smoke URL=https://api-xxxx.run.app       # smoke a deployed URL
make eval  URL=https://api-xxxx.run.app       # 5-case eval harness
make tf-plan && make tf-apply                  # provision GCP infra
```

## Stack notes

- **Backend**: FastAPI + OpenAI Agents SDK + `mcp[cli]`. `MCPServerStdio` and
  `MCPServerSse` are both wired and switched by `MCP_TRANSPORT`.
- **Frontend**: Next.js 16 App Router (no SSR data needs — the UI is a client
  component), `EventSource` for streaming, shadcn primitives.
- **Observability**: LangFuse + Agents SDK `@trace`; structlog JSON to stdout,
  picked up by Cloud Logging.
- **Infra**: Cloud Run (`min=0, max=5`, 1 CPU / 512Mi), Secret Manager for
  config, Artifact Registry for images, WIF for keyless CI auth.
