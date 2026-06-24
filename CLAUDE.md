# Mibegnon — guide agent

## Projet

App Next.js pour élèves de Côte d'Ivoire : catalogue de bourses, universités, favoris, suivi de candidatures, soumission communautaire de bourses.

## Architecture

- **App Router** : `app/(public)`, `app/(auth)`, `app/(dashboard)`
- **Données** : Prisma → PostgreSQL Supabase
- **Auth** : Supabase Auth ; l'`id` utilisateur Supabase = `User.id` Prisma (créé via `ensurePrismaUser()` à la première action métier)
- **Favoris bourses** : table `saved_scholarships` + `toggleBookmark` dans `lib/actions/bookmarks.ts`
- **Favoris universités** : table `bookmarks` (peu utilisé côté UI pour l'instant)
- **Candidatures** : `Application` + `Document` ; statuts enum `ApplicationStatus`

## Conventions

- Langue UI : français (ton accessible, expressions ivoiriennes légères OK sur empty states)
- Server Actions dans `lib/actions/` ou `app/.../actions.ts` avec `"use server"`
- Pages liste/détail : fetch Prisma côté serveur ; pas de `mock-data` pour le rendu public (mock réservé aux seeds)
- `notFound()` si enregistrement Prisma absent
- Revalidation : `revalidatePath` après mutations
- Composants client : suffixe explicite (`"use client"`) pour boutons interactifs (`SaveButton`, `ApplyButton`, `ApplicationCard`)

## Commandes

```bash
npm run dev
npx tsc --noEmit
npm run build
npx prisma migrate dev --name <change>
npx prisma generate
npm run scrape:ai:dry
```

## Schéma / migrations

- Une migration par changement de schéma, empilée sur `init`
- `@@unique([userId, scholarshipId])` sur `Application` pour dédoublonner « Suivre sur Mibegnon »
- Ne pas committer `.env*`

## Fichiers clés

| Zone | Fichiers |
|------|----------|
| Bourses | `app/(public)/bourses/`, `components/scholarship-card.tsx` |
| Universités | `app/(public)/universites/`, `components/university-card.tsx` |
| Dashboard | `app/(dashboard)/dashboard/{favoris,candidatures,profil}/` |
| Actions | `lib/actions/{bookmarks,applications,user}.ts` |
| Scrapers | `scripts/scrape-ai.ts`, `scripts/SCRAPER_DOCS.md` |

## Universités (pipeline bourses → fiches)

- **Expire bourses** : cron Vercel `GET /api/cron/expire-scholarships` daily 03:00 UTC (`vercel.json`) — désactive `deadline < now`, purge après 90j sans refs (`Application`/`SavedScholarship`/`Bookmark`), log `cron_runs`, `revalidateTag("scholarships")`. Auth : `Authorization: Bearer ${CRON_SECRET}`. Manuel : `npm run scholarships:expire`
- U1–U4 : voir `scripts/UNIVERSITIES_PIPELINE.md` — extraction IA, recherche web, validation, seed `isActive=false`
- U5 `scripts/publish-universities.ts` — publication manuelle après relecture

## Audit liens bourses (read-only)

- `npm run links:audit` — visite chaque `Scholarship.link` → `data/link_audit_report.json` + `link_audit_summary.md`
- `npm run links:audit:http` — palier HTTP seul (sans LLM)
- Voir `scripts/LINK_AUDIT.md` — HTTP → Haiku → Sonnet → juge cross-provider (DEAD gated)
- Aucune écriture DB ; `propose_deactivate` = suggestion humaine

## Dons (Stripe)

- Page : `app/(public)/soutenir/` — Checkout hébergé Stripe (aucune carte côté client)
- Actions : `lib/actions/donate.ts` — validation montant serveur, création `Donation` PENDING
- Webhook : `app/api/webhooks/stripe/route.ts` — signature + idempotence `stripe_webhook_events`
- Stats publiques : `GET /api/donations/stats` — agrégats Prisma uniquement (pas de lecture table via Supabase anon)
- RLS : `donations` et `stripe_webhook_events` sans policy → anon/authenticated refusés

## Chao (chatbot)

- Widget global : `components/chao-widget.tsx` monté dans `app/layout.tsx`
- API : `POST /api/chat` — Anthropic Haiku, prompt cache sur le persona, contexte bourses dynamique
- Anonymes : max 3 messages (`chao_anon` cookie signé httpOnly) + cookie IP/heure + **Upstash** 20 req/IP/jour (`lib/rate-limit.ts`) → 429 sans appel LLM
- Avatars : `public/chao-avatar.png`, `public/chao-icon.png` via `npm run chao:avatar`

## Perf / sécurité

- Indexes : migration `add_indexes` (scholarships, universities, FK bookmarks/applications/documents)
- Pages publiques catalogue : `revalidate = 3600` + `unstable_cache` dans `lib/data/{scholarships,universities}.ts`
- Headers : `next.config.ts` (CSP, HSTS prod, X-Frame-Options, nosniff, Referrer-Policy)
- `/soumettre` : Turnstile (`TURNSTILE_*`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) + rate-limit IP (`UPSTASH_*`)

## Pièges connus

- `SavedScholarship` n'a pas de relation Prisma vers `Scholarship` — joindre manuellement par `scholarshipId`
- `migrate dev` nécessite des credentials DB valides ; en CI utiliser `migrate deploy`
- Build exécute `prisma generate` via script `build`
