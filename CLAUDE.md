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

## Chao (chatbot)

- Widget global : `components/chao-widget.tsx` monté dans `app/layout.tsx`
- API : `POST /api/chat` — Anthropic Haiku, prompt cache sur le persona, contexte bourses dynamique
- Anonymes : max 3 messages (`chao_anon` cookie signé httpOnly) + plafond IP/heure
- Avatars : `public/chao-avatar.png`, `public/chao-icon.png` via `npm run chao:avatar`

## Pièges connus

- `SavedScholarship` n'a pas de relation Prisma vers `Scholarship` — joindre manuellement par `scholarshipId`
- `migrate dev` nécessite des credentials DB valides ; en CI utiliser `migrate deploy`
- Build exécute `prisma generate` via script `build`
