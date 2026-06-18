# ADR 0003 — Adaptateur de driver Prisma (PrismaPg + pg)

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Le projet utilise Prisma v7. Au premier usage runtime du client (le script de seed
de la phase 2), `new PrismaClient()` sans option s'est révélé invalide : Prisma v7
impose un **driver adapter** (le moteur de requêtes Rust embarqué n'est plus le défaut).
Le `lib/prisma.ts` hérité de la phase 1 ne fonctionnait donc pas à l'exécution
(l'absence n'était pas visible en phase 1 car aucun code n'instanciait Prisma au runtime).

## Décision

Utiliser l'adaptateur PostgreSQL officiel **`@prisma/adapter-pg`** (`PrismaPg`) reposant
sur le driver **`pg`**. `lib/prisma.ts` crée un `PrismaPg({ connectionString })` à partir
de `DATABASE_URL`, puis `new PrismaClient({ adapter })`, le tout protégé par le singleton
`globalThis` (le pool `pg` n'est instancié qu'une fois par process, y compris en dev avec
hot reload). Une erreur explicite est levée si `DATABASE_URL` est absente.

## Alternatives écartées

- **`@prisma/adapter-neon`** (driver serverless HTTP/WebSocket de Neon) : pertinent pour
  un déploiement serverless, mais `pg` (TCP classique) est plus simple et bien documenté
  pour démarrer ; on pourra basculer plus tard si besoin (déploiement Vercel serverless).
- **Rester sur l'ancien moteur Prisma** : non disponible par défaut en v7.
- **Downgrade de Prisma en v6** : irait à rebours de l'objectif « moderne et maintenu ».

## Conséquences

- Deux dépendances runtime ajoutées : `@prisma/adapter-pg`, `pg`.
- Couche d'accès aux données stable et compatible v7 pour toutes les phases suivantes.
- Le pool `pg` utilise le `max` par défaut (10) — à reconsidérer si déploiement serverless
  (risque d'épuisement de connexions) ; une bascule vers `@prisma/adapter-neon` resterait
  une option.
