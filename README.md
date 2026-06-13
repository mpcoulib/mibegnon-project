# Mibegnon

Plateforme pour aider les élèves ivoiriens à découvrir des bourses d'études et des universités à l'international.

## Stack

- **Framework** : [Next.js 16](https://nextjs.org) (App Router)
- **Base de données** : PostgreSQL (Supabase) via [Prisma](https://www.prisma.io)
- **Auth** : [Supabase Auth](https://supabase.com/docs/guides/auth)
- **UI** : Tailwind CSS 4, Radix UI / shadcn
- **Scraping** : scripts TypeScript + Claude (voir `scripts/SCRAPER_DOCS.md`)

## Prérequis

- Node.js 20+
- Compte Supabase (URL + clés anon)
- `DATABASE_URL` PostgreSQL (pooler Supabase recommandé)

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner les variables
npx prisma generate
npx prisma migrate deploy   # ou migrate dev en local
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL (Prisma) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `NEXT_PUBLIC_SITE_URL` | URL du site (callbacks auth), ex. `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | Scraping, traduction, chatbot Chao (serveur uniquement) |
| `CHAO_COOKIE_SECRET` | Signature des cookies compteur anonyme (prod obligatoire) |
| `CRON_SECRET` | Auth Bearer pour `/api/cron/*` (Vercel Cron l'envoie auto si défini) |
| `UPSTASH_REDIS_REST_URL` | Redis Upstash (rate-limit Chao + soumissions) |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (widget `/soumettre`) |
| `TURNSTILE_SECRET_KEY` | Secret Turnstile (vérif serveur) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (Checkout + webhooks) |
| `STRIPE_WEBHOOK_SECRET` | Secret du endpoint webhook Stripe |
| `DONATION_MONTHLY_GOAL_CENTS` | Objectif mensuel affiché (défaut : 50000 = 500 €) |

## Scripts npm

| Commande | Usage |
|----------|--------|
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |
| `npm run scrape` | Scraper regex (ScholarshipRegion) |
| `npm run scrape:ai` | Scraper Claude (recommandé) |
| `npm run scrape:dry` | Scraper test (10 posts) |
| `npm run translate` | Traduction des descriptions FR |
| `npm run fix-links` | Audit / correction des liens bourses |
| `npm run chao:avatar` | Regénère `public/chao-avatar.png` et `chao-icon.png` |
| `npm run test:e2e` | Tests Playwright (dont Chao widget) |

Détails du pipeline de scraping : [`scripts/SCRAPER_DOCS.md`](scripts/SCRAPER_DOCS.md).

## Migrations Prisma

Le schéma est versionné sous `prisma/migrations/`. Ne pas utiliser `db push` en production.

```bash
npx prisma migrate dev --name <nom>   # développement
npx prisma migrate deploy             # CI / prod
npx prisma migrate status
```

## Structure (aperçu)

```
app/
  (public)/     # Pages publiques (bourses, universités, soumettre)
  (auth)/       # Connexion, inscription
  (dashboard)/  # Espace connecté (favoris, candidatures, profil)
lib/
  actions/      # Server actions (bookmarks, applications, profil)
  prisma.ts     # Client Prisma singleton
prisma/         # Schéma + migrations
scripts/        # Scrapers et seeds
```

## Licence

Projet privé — voir l'équipe Mibegnon.
