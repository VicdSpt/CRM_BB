# CRM-BB — CRM pour coach sportif / boxe

Outil de gestion (rendez-vous, élèves, finances) pour un coach sportif.

## Stack

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Prisma · PostgreSQL (Neon) · Vitest.

## Démarrer en local

1. Installer les dépendances : `npm install`
2. Copier `.env.example` vers `.env` et renseigner `DATABASE_URL` (Neon).
3. Appliquer les migrations : `npx prisma migrate dev`
4. Lancer le serveur : `npm run dev` → http://localhost:3000

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run test` — tests (Vitest)
- `npm run format` — formatage Prettier
- `npx prisma studio` — explorer la base

## Documentation

- Specs : `docs/superpowers/specs/`
- Plans : `docs/superpowers/plans/`
- Décisions & historique : `docs/historique/`
