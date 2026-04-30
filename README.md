# MCP Agent

An MCP-driven agent. FastAPI backend wraps the OpenAI Agents SDK and an MCP
client; a Next.js frontend streams tool calls and the final result over
Server-Sent Events. Both services run on Google Cloud Run.

## Architecture

```
                       GitHub                Google Cloud
                  ┌─────────────────┐    ┌──────────────────────────────┐
                  │                 │    │                              │
   git push ───▶  │  Actions deploy │ ──▶│  Artifact Registry           │
                  │  (lint+test,    │    │  Cloud Run · web (Next.js)   │
                  │   build, deploy)│    │  Cloud Run · api (FastAPI)   │
                  │                 │    │  Secret Manager (4 secrets)  │
                  └─────────────────┘    │                              │
                          ▲              └──────────────┬───────────────┘
                          │ WIF                         │
                          │ (no JSON keys)              │ MCP (stdio | SSE)
                                                        ▼
                                                ┌──────────────┐
                                                │  MCP server  │
                                                └──────────────┘

  Browser ──HTTPS──▶ web ──REST + SSE──▶ api ──MCP──▶ MCP server
                      │                    │
                      └─ Geist + shadcn    └─ Agents SDK @trace ─▶ LangFuse
                                              structlog JSON ────▶ Cloud Logging
```

## Repo layout

```
apps/api/        FastAPI backend (routes, services, agents, mcp, schemas)
apps/web/        Next.js 16 App Router frontend
infra/           Terraform: Cloud Run, Artifact Registry, Secret Manager, WIF
scripts/         list_tools.py, smoke.sh, pre_warm.sh
evals/           5-case smoke harness
.github/         GitHub Actions deploy workflow
```

## Quick start

```bash
cp .env.example .env          # fill in OPENAI_API_KEY, MCP_SERVER_URL, LangFuse keys
make dev                       # api on :8000, web on :3000 via docker compose
make test                      # pytest + tsc
```

## Configuration

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | LLM provider key |
| `MCP_TRANSPORT` | `sse` or `stdio` |
| `MCP_SERVER_URL` | Required when transport is `sse` |
| `MCP_STDIO_COMMAND` / `MCP_STDIO_ARGS` | Required when transport is `stdio` |
| `STRONG_MODEL` / `FAST_MODEL` | Model routing |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | Trace export (optional) |
| `NEXT_PUBLIC_API_URL` | Frontend's API origin (baked at web build time) |

In production these come from Google Secret Manager via Terraform. The
sentinel `REPLACE_ME` is treated as unset.

## Endpoints

```
GET  /health                # liveness + config flags
POST /agent/run             # synchronous agent call
GET  /agent/stream?prompt=  # SSE: tool_call | tool_result | final
```

## Deploy

Push to `main`. GitHub Actions runs three stages:

1. `lint-test`: ruff + pytest, eslint + tsc + next build
2. `build-push` (matrix): docker buildx push to Artifact Registry
3. `deploy` (matrix): deploy-cloudrun for both services

Auth uses Workload Identity Federation. No JSON service-account key is stored.

## Tooling

```bash
make list-tools URL=https://example.com/sse   # dump MCP tool schemas
make smoke      URL=https://api-xxxx.run.app  # smoke a deployed URL
make eval       URL=https://api-xxxx.run.app  # 5-case eval harness
make tf-plan && make tf-apply                  # provision GCP infra
```
