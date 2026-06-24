# Scholarship external-link audit

Read-only pipeline: visit every `Scholarship.link`, classify, report. **No DB writes.**

## Quick start

```bash
# Cheap pass — HTTP only (no LLM cost)
npm run links:audit:http -- --limit 50

# Full pipeline (HTTP → Haiku → Sonnet → judge)
npm run links:audit -- --limit 20 --concurrency 5

# All scholarships
npm run links:audit
```

## Outputs

| File | Content |
|------|---------|
| `data/link_audit_report.json` | Full report + summary stats |
| `data/link_audit_summary.md` | Human-readable counts + flagged rows |

## Pipeline (per link)

```
Stage 0 — HTTP probe (no model)
  HEAD/GET, redirects ≤5, 10s timeout, retry 2
  → 200 same host + content     ⇒ ALIVE (high) → DONE
  → 404/410/soft-404          ⇒ tentative DEAD → judge
  → redirect / 403 / JS shell   ⇒ Stage 1

Stage 1 — Haiku bulk classify (prompt-cache rubric)
  OPEN | CLOSED | EXPIRED | MOVED | DEAD | UNSURE
  UNSURE → Stage 2

Stage 2 — Sonnet render/hunt
  Redirect chains, login pages, new URL hunt
  Still UNSURE → Stage 2b (Sonnet hard leaf)

Stage 3 — Cross-provider judge (DEAD/CLOSED/EXPIRED/MOVED only)
  GPT + Gemini independent votes
  ≥2 confirm required for DEAD; else NEEDS_REVIEW (keep live)
```

## Model roles (swap via env)

| Role | Default ID | Env override |
|------|------------|--------------|
| Bulk classify | `claude-haiku-4-5-20251001` | `LINK_AUDIT_CLASSIFY_MODEL` |
| Render / hunt | `claude-sonnet-4-20250514` | `LINK_AUDIT_RENDER_MODEL` |
| Hard leaf | `claude-sonnet-4-20250514` | `LINK_AUDIT_HARD_MODEL` |
| Judge GPT | `gpt-4.1` | `LINK_AUDIT_JUDGE_GPT_MODEL` |
| Judge Gemini | `gemini-2.5-pro` | `LINK_AUDIT_JUDGE_GEMINI_MODEL` |

Re-check provider release notes before large runs; IDs are point-in-time.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Load scholarships |
| `ANTHROPIC_API_KEY` | Stages 1–2 | Classify / render |
| `OPENAI_API_KEY` | Judge (recommended) | Gate DEAD verdicts |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Judge (recommended) | Second judge family |

Without judge keys, irreversible verdicts downgrade to `NEEDS_REVIEW`.

## CLI flags

| Flag | Default | Description |
|------|---------|-------------|
| `--limit N` | all | Max rows |
| `--offset N` | 0 | Skip first N |
| `--concurrency N` | 10 | Parallel probes (domain rate-limited ~350ms) |
| `--http-only` | off | Skip all LLM + judge |
| `--active-only` | off | Only `isActive=true` |
| `--output path` | `data/link_audit_report.json` | JSON path |
| `--summary path` | `data/link_audit_summary.md` | Markdown path |

## Verdict schema (each item)

```json
{
  "id": "…",
  "link": "…",
  "finalUrl": "…",
  "httpStatus": 404,
  "verdict": "DEAD|CLOSED|EXPIRED|MOVED|ALIVE|NEEDS_REVIEW",
  "confidence": 0.85,
  "evidence": "quoted text / redirect chain",
  "judges": { "gpt-5.5": "confirm", "gemini-3.1-pro": "reject" },
  "suggestedAction": "keep|flag_needs_review|propose_deactivate|update_link",
  "newUrlCandidate": null
}
```

## Suggested actions (report only)

| Action | Meaning |
|--------|---------|
| `keep` | Link OK |
| `flag_needs_review` | Ambiguous or judge disagreed — manual check |
| `propose_deactivate` | Judge-confirmed closed/dead — human decides |
| `update_link` | MOVED with candidate URL |

Wire into `needsReview` / expire cron later; this script does not mutate.

## Cost guardrails

- Start with `--http-only` or `--limit 20`
- LLM only when HTTP can't decide
- Prompt-cache on classify instructions
- Domain politeness (350ms gap + jitter)
- Escalation ladder: HTTP → Haiku → Sonnet — never skip to Opus by default

## Legacy script

`scripts/audit-links.ts` — static heuristics (aggregators, login URLs). Keep for quick domain checks; use `audit-scholarship-links.ts` for live probing.
