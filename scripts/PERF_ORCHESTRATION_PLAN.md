# Mibegnon — Perf Remediation Orchestration Plan

Global / low-connectivity performance for West-Africa mobile users. Implements the
remaining P1+P2 fixes from the perf audit. **Plan only — agents run in Cursor (all
providers available). Do not auto-commit; leave diff in working tree for human review.**

> Model caveat: lineup shifts fast (planning cutoff Jan 2026). Use the named model OR
> its current same-tier successor. V4 panel MUST stay cross-provider.

---

## 0. Already landed (prior pass — do NOT redo)
`regions:["fra1"]` · public layout static (auth moved client-side in Navbar) ·
AVIF/WebP config · Supabase preconnect · ChaoWidget lazy `ssr:false` · hero+massa
`sizes` · massa.jpg 810KB→70KB · chao avatars optimized · loading.tsx skeletons
(bourses/universites/dashboard). Build verified: `/` now `○ Static`.

---

## 1. Work items (this plan)

| ID | Fix | Primary files (sole owner unless noted) |
|----|-----|------|
| A | Pagination (`take`/cursor) + `select` trim on list queries | `lib/data/scholarships.ts`, `lib/data/universities.ts` |
| B | `/bourses` → ISR: move saved-state client-side, drop `getUser()` from page | `app/(public)/bourses/page.tsx`, `components/save-button*`, `components/scholarship-card.tsx` |
| C | `generateStaticParams` for detail pages | `app/(public)/bourses/[id]/page.tsx`, `app/(public)/universites/[id]/page.tsx` |
| D | Precompute country SVG paths at build; drop d3-geo/topojson/world-atlas from runtime | `lib/country-map.ts`, new `scripts/precompute-country-paths.ts`, `package.json` build script |
| E | Remove Playfair_Display font (system serif for logo) | `app/layout.tsx`, `components/navbar.tsx`, CSS |
| F | Service worker (`@serwist/next`) — offline app shell + seen lists | `next.config.ts`, `app/sw.ts`, `package.json` |
| G | Middleware audit — matcher skips public static routes | `middleware.ts` / `lib/supabase/middleware.ts` |

---

## 2. Conflict map (drives ownership + ordering)

- `scholarship-card.tsx`: wanted by **B** (isSaved) and **D** (country path).
  → **Constraint:** D keeps `getCountryPath()` signature identical, edits only
  `country-map.ts` internals + build script. → card is B's alone. Conflict removed.
- `next.config.ts`: **F** only (images block already landed; G doesn't touch).
- detail pages `[id]`: **C** only; B owns list page. Disjoint.
- `lib/data/*`: **A** only. B consumes new signatures → **B depends on A**.
- `app/layout.tsx`: **E** only.

**Result:** file-disjoint EXCEPT B→A. So AB = one serial track; C, D, E, F, G parallel.

---

## 3. Phases

Maps to `Workflow` primitives: Phase 0 = `parallel` barrier; Phase 1 = `parallel` of
worktree agents; Phase 2 = single agent; Phase 3 = `parallel` barrier. Concurrency cap
16 — 6 impl agents fit. Worktree isolation on all Phase-1 agents (parallel file mutation).

### Phase 0 — Recon (parallel, read-only, no worktree, BARRIER)
Each returns a structured spec (not edits). Gate: all specs non-empty.

| Agent | Output schema | Model | Why |
|-------|---------------|-------|-----|
| R1 card-fields | `{scholarshipFields:[], universityFields:[]}` | Haiku 4.5 / Gemini 2.5 Flash | mechanical field extraction |
| R2 saved-state | `{currentFlow, clientPlan, newEndpoint?}` | Sonnet 4.6 / GPT-5 | design judgment |
| R3 map-usage | `{signature, callSites:[], buildHook}` | Haiku 4.5 | grep + signature |
| R4 middleware | `{currentMatcher, refreshesAuth, proposedMatcher}` | Sonnet 4.6 / GPT-5 | auth-correctness reasoning |
| R5 serwist | `{nextVersion, steps:[], swStrategy}` | Gemini 3 Pro / Sonnet 4.6 | version-specific, big-ctx docs |

Barrier justified: Phase-1 specs needed before any edit; reads are cheap.

### Phase 1 — Implement (parallel, each agent `isolation: worktree`)
Inject the matching Phase-0 spec. Each runs `npx tsc --noEmit` on its scope before
returning `{worktree, filesChanged:[], summary, tscPass}`.

| Track | Scope | Model | Why |
|-------|-------|-------|-----|
| **AB** (serial pipeline, 1 worktree) | A: pagination+select per R1 → B: client saved-state per R2, `/bourses` ISR, drop `getUser()` | GPT-5-Codex / Sonnet 4.6 | contract change, multi-file, careful |
| **C** | generateStaticParams both detail pages (query ids directly → independent of A) | Sonnet 4.6 / GPT-5-Codex | medium codegen |
| **D** | precompute script + wire to `prebuild`, refactor country-map to load generated JSON, KEEP API | Opus 4.8 / GPT-5 high | tricky build wiring + API stability |
| **E** | remove Playfair, system serif logo, clean CSS var | Haiku 4.5 / GPT-5-mini | mechanical |
| **F** | `@serwist/next`, `app/sw.ts`, config, offline fallback | Opus 4.8 / GPT-5-Codex | highest-risk, novel infra |
| **G** | tighten middleware matcher per R4 | Sonnet 4.6 / GPT-5 | security-sensitive, small |

### Phase 2 — Integrate (single agent, main tree)
Model: **Opus 4.8 / GPT-5 high**.
- Merge worktree diffs in dep order: AB → C → D,E,G → F.
- Conflicts only if ownership violated → arbiter reconciles, prefers spec.
- Gate: `npx tsc --noEmit` && `npm run build`.
- Build fail → `SendMessage` the owning track agent for fix pass → re-integrate. Max 2 loops.

### Phase 3 — Verify (parallel, BARRIER; all pass = done)

| Agent | Check / schema | Model | Why |
|-------|----------------|-------|-----|
| V1 route-table | parse build output: `/bourses/[id]` prerendered, `/` still `○`, no public route regressed → `{regressions:[]}` | Haiku 4.5 | parse/assert |
| V2 bundle delta | chunk sizes vs baseline; assert d3-geo/topojson gone client-side, Playfair woff2 gone, total down → `{before,after,removed:[]}` | Haiku 4.5 / Gemini 2.5 Flash | measure |
| V3 offline smoke | build, serve, load, kill network, reload → shell renders (playwright skill) → `{offlineWorks}` | Sonnet 4.6 | drive browser + judge |
| V4 adversarial panel ×3 | each REFUTES: saved-state auth leak / CSP / hydration flash; middleware matcher skips auth where needed?; ISR staleness of saved-state. Flag if ≥2 refute → `{verdicts:[]}` | **Opus 4.8 + GPT-5 high + Gemini 3 Pro** (one each) | cross-provider diversity catches failure modes one family misses |

Any V fail → targeted fix on owning track → re-gate.

---

## 4. Model tiers (reference)

| Tier | Use | Models (best → fallback) |
|------|-----|--------------------------|
| Reasoning-max | adversarial review, arbiter, risky build wiring | Claude Opus 4.8 · GPT-5.x high · Gemini 3 Pro · o4 |
| Codegen-strong | impl tracks | GPT-5-Codex · Claude Sonnet 4.6 · Claude Opus 4.8 |
| Fast-cheap | recon, mechanical edits, parse/measure | Claude Haiku 4.5 · Gemini 2.5 Flash · GPT-5-mini |
| Long-context | repo map, bundle scan | Gemini 3 Pro · Claude Opus 4.8 [1m] |

**Principle:** match model to task shape, not prestige. V4 stays cross-provider on purpose.

---

## 5. Gates summary
1. Per-track `tsc` (Phase 1)
2. Integrated `tsc` + `npm run build` (Phase 2, blocking, ≤2 repair loops)
3. Route-table + bundle-delta + offline-smoke + cross-provider adversarial (Phase 3)
4. No commit — report diff summary; human reviews (matches repo convention).

## 6. Rollback
- Each track isolated in its worktree — discard a bad track without touching others.
- D risk (build script): if precompute fails, revert `country-map.ts` to runtime import,
  keep generated JSON unused. Build script guarded so missing JSON falls back.
- F risk (service worker): ship behind a flag / `disable` in dev; if offline cache
  serves stale, bump serwist cache version or unregister SW. Verify SW scope before merge.
- B risk (ISR + client saved-state): if hydration flash or auth leak found in V4, revert
  `/bourses` to dynamic `getUser()` (current behavior) — region:fra1 still covers latency.

## 7. Out of scope / explicit non-goals
- Network/ISP SSL block (`safebrowse.io` / Comcast xFi) — separate, user-side unblock.
- No schema migrations. No DB region move (Supabase stays Frankfurt; fra1 colocates).
- No commit/push without explicit user ask.
