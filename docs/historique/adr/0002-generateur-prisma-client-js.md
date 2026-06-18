# ADR 0002 — Générateur Prisma `prisma-client-js` à sortie par défaut

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Prisma v7 a introduit un nouveau générateur `prisma-client` avec une sortie
personnalisée (`output = "../lib/generated/prisma"`) et a déplacé la configuration
`datasource.url` hors du `schema.prisma` vers `prisma.config.ts` (qui importe
`dotenv/config` et expose `DATABASE_URL`). Ce scaffolding est incohérent avec
`lib/prisma.ts` qui importe `PrismaClient` depuis `@prisma/client` (chemin
conventionnel). De plus, en Prisma v7, la propriété `url` dans le bloc `datasource`
de `schema.prisma` est devenue invalide et doit être supprimée.

## Décision

- Utiliser le générateur classique `prisma-client-js` sans directive `output`,
  ce qui régénère le client vers `node_modules/@prisma/client` (chemin par défaut).
- Conserver `prisma.config.ts` (généré par Prisma v7) avec `import "dotenv/config"`
  pour charger `DATABASE_URL` depuis `.env` ; dotenv était déjà présent en devDependency.
- Supprimer la ligne `url = env("DATABASE_URL")` du bloc `datasource` dans
  `schema.prisma` (obligatoire en Prisma v7 : l'URL est gérée exclusivement par
  `prisma.config.ts`).

## Alternatives écartées

- **Adopter le nouveau générateur `prisma-client` avec sortie custom et mettre à
  jour l'import dans `lib/prisma.ts` vers `@/lib/generated/prisma`** : écarté car
  cela dévie du chemin conventionnel le mieux documenté, alourdissant la maintenance
  pour un développeur solo et risquant de casser l'intégration Vercel / le build sans
  bénéfice fonctionnel immédiat.

## Conséquences

- Le chemin d'import Prisma reste `@prisma/client` partout dans l'application,
  conforme à la documentation officielle et aux exemples Next.js.
- `prisma generate` doit être exécuté avant tout build ou déploiement (comportement
  standard Prisma).
- `prisma.config.ts` est conservé en racine du projet et gère la connexion Neon
  via `DATABASE_URL` (`.env` non commité).
