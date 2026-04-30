"""Run eval cases against a deployed (or local) API URL.

Usage:
    python evals/run.py http://localhost:8000
    python evals/run.py https://assessment-api-xxxx.run.app

Each case is scored on:
- ran:                request returned 200
- expected_tools:     all listed tools were called (skip if empty)
- forbidden_tools:    none of these tools were called
- expected_keywords:  every keyword appears in the reply (case-insensitive)
- forbidden_keywords: none of these strings appear in the reply

Output is a green/amber/red table.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import httpx

CASES = Path(__file__).resolve().parent / "cases.json"


def grade(case: dict, body: dict, status: int, latency_ms: int) -> tuple[str, list[str]]:
    notes: list[str] = []
    if status != 200:
        return "red", [f"HTTP {status}"]

    reply = (body.get("reply") or "").lower()
    actual_tools = [c.get("name", "") for c in body.get("tool_calls", [])]

    missing_tools = [t for t in case.get("expected_tools", []) if t not in actual_tools]
    used_forbidden = [t for t in case.get("forbidden_tools", []) if t in actual_tools]
    missing_keywords = [k for k in case.get("expected_keywords", []) if k.lower() not in reply]
    leaked_keywords = [k for k in case.get("forbidden_keywords", []) if k.lower() in reply]

    if missing_tools:
        notes.append(f"missing tools: {missing_tools}")
    if used_forbidden:
        notes.append(f"forbidden tools used: {used_forbidden}")
    if missing_keywords:
        notes.append(f"missing keywords: {missing_keywords}")
    if leaked_keywords:
        notes.append(f"leaked keywords: {leaked_keywords}")
    if latency_ms > 30_000:
        notes.append(f"slow ({latency_ms}ms)")

    if used_forbidden or leaked_keywords:
        return "red", notes
    if missing_tools or missing_keywords:
        return "amber", notes
    return "green", notes


def main() -> int:
    if len(sys.argv) < 2:
        sys.stderr.write("usage: python evals/run.py <api_url>\n")
        return 2

    base = sys.argv[1].rstrip("/")
    cases = json.loads(CASES.read_text())["cases"]

    rows: list[tuple[str, str, int, str]] = []
    with httpx.Client(timeout=60) as client:
        for case in cases:
            t0 = time.perf_counter()
            try:
                response = client.post(
                    f"{base}/agent/chat",
                    json={"messages": case["messages"]},
                    headers={"x-eval-case": case["id"]},
                )
                latency_ms = int((time.perf_counter() - t0) * 1000)
                try:
                    body = response.json()
                except Exception:
                    body = {"reply": response.text}
                tier, notes = grade(case, body, response.status_code, latency_ms)
            except Exception as exc:
                latency_ms = int((time.perf_counter() - t0) * 1000)
                tier, notes = "red", [str(exc)]
            rows.append((case["id"], tier, latency_ms, "; ".join(notes) or "ok"))

    print(f"{'id':<10}{'tier':<8}{'ms':>8}  notes")
    print("-" * 70)
    counts = {"green": 0, "amber": 0, "red": 0}
    for case_id, tier, latency_ms, notes in rows:
        counts[tier] += 1
        print(f"{case_id:<10}{tier:<8}{latency_ms:>8}  {notes}")
    print("-" * 70)
    print(f"green={counts['green']}  amber={counts['amber']}  red={counts['red']}")
    return 0 if counts["red"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
