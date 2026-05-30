# University research pipeline

Enrich the catalogue from **active scholarships** → **staged universities** (`isActive=false`) → human publish.

## Flow

```
U0 expire scholarships
  → U1 extract candidates (AI)
  → U2 research (AI + web_search)
  → U3 validate links + schema
  → U4 seed DB (isActive=false)
  → U5 publish (you)
```

## Commands

| Step | Command |
|------|---------|
| U0 | `npm run scholarships:expire` / `scholarships:expire:dry` |
| U1 | `npm run universities:extract` / `universities:extract:dry` |
| U2 | `npm run universities:research` (add `--limit 5` for tests) |
| U3 | `npm run universities:validate` |
| U4 | `npm run universities:seed` / `universities:seed:dry` |
| U5 | `npx tsx scripts/publish-universities.ts --ids <id>` or `--all-staged` |

## Data files (`data/`)

| File | Producer |
|------|----------|
| `universities-to-research.json` | U1 — NEW universities only |
| `universities-researched.json` | U2 — merges on re-run |
| `universities-validated.json` | U3 — ready to seed |

## Parallel U2 (fan-out)

For large batches, split with `--offset` / `--limit` in separate terminals:

```bash
npx tsx scripts/research-universities.ts --offset 0   --limit 20 --concurrency 3
npx tsx scripts/research-universities.ts --offset 20  --limit 20 --concurrency 3
```

Each run merges into `universities-researched.json`.

## Cron (later)

```cron
0 3 * * * cd /path/to/mibegnon && npm run scholarships:expire
```

## Requirements

- `DATABASE_URL`, `ANTHROPIC_API_KEY`
- Anthropic Console: **web search** enabled for U2
- Human review before publish — staged rows stay hidden from public lists that filter `isActive: true`
