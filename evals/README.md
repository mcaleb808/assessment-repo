# Evals

Five-case smoke harness for the agent. Fill `cases.json` with real prompts,
run against a deployed URL, and read the green/amber/red table.

## Add a case

Each case in `cases.json` has:

- `id`               — short identifier (`EX-001`)
- `prompt`           — the user input
- `expected_tools`   — list of tool names the agent **must** call (or `[]` to skip)
- `expected_keywords` — substrings (case-insensitive) the result **must** contain
- `notes`            — free-form context

Tier rules:

- **green** — 200, all expected tools called, all keywords present, latency < 30s
- **amber** — 200 but missed at least one expectation
- **red**   — non-200 or transport error

## Run

```bash
python evals/run.py http://localhost:8000
python evals/run.py https://assessment-api-xxxx.us-central1.run.app

# or via make
make eval URL=https://assessment-api-xxxx.us-central1.run.app
```

## Scope

Smoke harness, not a production eval. No LLM-judge, no MRR/NDCG, no statistical
confidence. The point is: a stranger can run my deployed thing on five real
prompts and get green back.
