# Evals

Smoke harness for the chat agent. Run it against a deployed (or local) API
URL and read the green/amber/red table.

## Add a case

Each case in `cases.json` has:

- `id`                  - short identifier (e.g. `AUTH-001`)
- `messages`            - the conversation to send to `/agent/chat`
- `expected_tools`      - tool names the agent **must** call (or `[]` to skip)
- `forbidden_tools`     - tool names that **must not** be called (security gate)
- `expected_keywords`   - substrings (case-insensitive) the reply **must** contain
- `forbidden_keywords`  - substrings the reply **must not** contain (e.g. PINs)
- `notes`               - free-form context

Tier rules:

- **green** - 200, all expected tools called, all keywords present, no
  forbidden tool used, no forbidden keyword leaked, latency under 30s
- **amber** - 200 but missed an expected tool or keyword
- **red**   - non-200, transport error, forbidden tool called, or forbidden
  keyword leaked

## Run

```bash
python evals/run.py http://localhost:8000
python evals/run.py https://assessment-api-6lot3576iq-uc.a.run.app

# or via make
make eval URL=https://assessment-api-6lot3576iq-uc.a.run.app
```

## Scope

Smoke harness, not a production eval. No LLM-judge, no MRR/NDCG, no statistical
confidence. The point is: a stranger can run the deployed thing on a handful
of real conversations and get green back.
