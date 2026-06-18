# Phase 1 — Fondations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le squelette technique du CRM : application Next.js qui tourne, base de données PostgreSQL connectée via Prisma avec le schéma de données complet, outils de qualité/tests configurés, et structure de traçabilité (`docs/historique/`).

**Architecture:** Une seule application Next.js (App Router, TypeScript) servant front et back. Prisma comme couche d'accès à une base PostgreSQL hébergée chez Neon. Tailwind + shadcn/ui pour l'UI. Vitest pour les tests. Aucune fonctionnalité métier en phase 1 — uniquement des fondations vérifiables.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui, Prisma, PostgreSQL (Neon), Vitest, ESLint, Prettier.

## Global Constraints

- Mono-utilisateur (le coach) pour la v1 — pas de gestion multi-rôles.
- Mobile-first dans toute l'UI.
- TypeScript en mode strict partout.
- Validation serveur avec Zod (mise en place dès qu'un formulaire existe ; pas en phase 1).
- Secrets uniquement dans `.env` (jamais commité). `.env.example` documente les variables.
- Git : branche par fonctionnalité, commits petits, jamais de push direct sur `main`.
- Toute décision d'architecture notable → un ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Branche de travail

**Files:**

- Aucun fichier (opération Git).

- [ ] **Step 1: Créer la branche de la phase 1**

Run:

```bash
git checkout -b feat/fondations
```

Expected: `Switched to a new branch 'feat/fondations'`

---

### Task 2 : Scaffold de l'application Next.js

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `eslint.config.mjs`, `.gitignore`, etc. (générés par `create-next-app`).

**Interfaces:**

- Produces: une app Next.js démarrable avec `npm run dev`, build avec `npm run build`.

- [ ] **Step 1: Générer l'app à la racine du dépôt**

L'outil refuse un dossier non vide. On génère dans un sous-dossier temporaire puis on remonte les fichiers, afin de conserver le dossier `docs/` et l'historique Git existants.

Run (PowerShell) :

```powershell
npx create-next-app@latest .app-temp --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack
```

Réponses attendues : accepter les défauts. Expected : un dossier `.app-temp/` contenant l'app générée.

- [ ] **Step 2: Remonter les fichiers générés à la racine et supprimer le dossier temporaire**

Run (PowerShell) :

```powershell
Get-ChildItem -Path .app-temp -Force | Where-Object { $_.Name -ne '.git' } | ForEach-Object { Move-Item -Path $_.FullName -Destination . -Force }
Remove-Item .app-temp -Recurse -Force
```

Expected : `package.json`, `app/`, `next.config.ts` etc. présents à la racine ; `.app-temp` supprimé.

- [ ] **Step 3: Vérifier que l'app démarre**

Run :

```bash
npm run dev
```

Expected : serveur sur `http://localhost:3000`, page d'accueil Next.js par défaut affichée. Arrêter avec Ctrl+C.

- [ ] **Step 4: Vérifier le build de production**

Run :

```bash
npm run build
```

Expected : build réussi sans erreur TypeScript.

- [ ] **Step 5: Activer le mode strict TypeScript (si pas déjà actif)**

Vérifier que `tsconfig.json` contient `"strict": true` dans `compilerOptions`. Si absent, l'ajouter.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold application Next.js (TypeScript, Tailwind, ESLint)"
```

---

### Task 3 : Configurer Prettier

**Files:**

- Create: `.prettierrc`, `.prettierignore`
- Modify: `package.json` (script `format`)

- [ ] **Step 1: Installer Prettier**

Run :

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

- [ ] **Step 2: Créer `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Créer `.prettierignore`**

```
node_modules
.next
.app-temp
prisma/migrations
```

- [ ] **Step 4: Ajouter le script `format` dans `package.json`**

Dans `"scripts"`, ajouter :

```json
"format": "prettier --write ."
```

- [ ] **Step 5: Lancer le formatage**

Run :

```bash
npm run format
```

Expected : Prettier reformate les fichiers sans erreur.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configurer Prettier"
```

---

### Task 4 : Mettre en place Vitest

**Files:**

- Create: `vitest.config.ts`, `lib/sample.ts`, `lib/sample.test.ts`
- Modify: `package.json` (scripts `test`, `test:run`)

**Interfaces:**

- Produces: commande `npm run test` qui exécute les tests Vitest.

- [ ] **Step 1: Installer Vitest**

Run :

```bash
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: Créer `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Ajouter les scripts dans `package.json`**

Dans `"scripts"`, ajouter :

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Écrire un test qui échoue**

Créer `lib/sample.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { add } from "./sample";

describe("add", () => {
  it("additionne deux nombres", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il échoue**

Run :

```bash
npm run test:run
```

Expected : ÉCHEC — `Cannot find module './sample'` (le fichier `sample.ts` n'existe pas encore).

- [ ] **Step 6: Écrire l'implémentation minimale**

Créer `lib/sample.ts` :

```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il passe**

Run :

```bash
npm run test:run
```

Expected : SUCCÈS — 1 test passé.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: configurer Vitest avec un test de fumée"
```

---

### Task 5 : Initialiser Prisma et la connexion base de données

**Files:**

- Create: `prisma/schema.prisma`, `.env`, `.env.example`, `lib/prisma.ts`
- Modify: `.gitignore` (vérifier que `.env` est ignoré)

**Interfaces:**

- Produces: un client Prisma exporté depuis `lib/prisma.ts` (`import { prisma } from "@/lib/prisma"`).

> **Action manuelle requise :** créer un compte gratuit sur https://neon.tech, créer un projet, copier la chaîne de connexion (`postgresql://...`). Elle servira de `DATABASE_URL`. Pour le développement, un projet Neon « dev » suffit.

- [ ] **Step 1: Installer Prisma**

Run :

```bash
npm install -D prisma
npm install @prisma/client
```

- [ ] **Step 2: Initialiser Prisma**

Run :

```bash
npx prisma init
```

Expected : crée `prisma/schema.prisma` et ajoute `DATABASE_URL` dans `.env`.

- [ ] **Step 3: Renseigner `.env` avec la chaîne Neon**

Éditer `.env` :

```
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
```

(Remplacer par la vraie chaîne Neon.)

- [ ] **Step 4: Créer `.env.example` (commité, sans secret)**

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

- [ ] **Step 5: Vérifier que `.env` est bien ignoré par Git**

Vérifier que `.gitignore` contient une ligne `.env` (ajoutée par `prisma init` ou `create-next-app`). Si absente, l'ajouter. **Confirmer** : `git status` ne doit PAS lister `.env`.

- [ ] **Step 6: Créer le singleton Prisma**

Créer `lib/prisma.ts` :

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialiser Prisma et la connexion base de données"
```

---

### Task 6 : Définir le schéma de données complet

**Files:**

- Modify: `prisma/schema.prisma`

**Interfaces:**

- Produces: les modèles Prisma `Coach`, `Eleve`, `Seance`, `Participation`, `Pack`, `Paiement` et les enums `TypeSeance`, `StatutSeance`, `StatutReglement`, `MethodePaiement`. Tables créées en base via migration.

- [ ] **Step 1: Écrire le schéma**

Remplacer le contenu de `prisma/schema.prisma` (en conservant les blocs `generator` et `datasource` existants) par :

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TypeSeance {
  PRIVE
  COLLECTIF
}

enum StatutSeance {
  PLANIFIEE
  REALISEE
  ANNULEE
}

enum StatutReglement {
  A_REGLER
  PAYE
  COUVERT_PAR_PACK
}

enum MethodePaiement {
  ESPECES
  CB
  VIREMENT
}

model Coach {
  id         String   @id @default(cuid())
  email      String   @unique
  motDePasse String
  nom        String
  createdAt  DateTime @default(now())
}

model Eleve {
  id             String          @id @default(cuid())
  prenom         String
  nom            String
  telephone      String?
  email          String?
  notes          String?
  archive        Boolean         @default(false)
  dateAjout      DateTime        @default(now())
  participations Participation[]
  packs          Pack[]
  paiements      Paiement[]
}

model Seance {
  id             String          @id @default(cuid())
  type           TypeSeance
  dateHeureDebut DateTime
  dureeMinutes   Int
  lieu           String?
  prixReference  Decimal         @db.Decimal(10, 2)
  statut         StatutSeance    @default(PLANIFIEE)
  createdAt      DateTime        @default(now())
  participations Participation[]
}

model Participation {
  id              String          @id @default(cuid())
  seance          Seance          @relation(fields: [seanceId], references: [id], onDelete: Cascade)
  seanceId        String
  eleve           Eleve           @relation(fields: [eleveId], references: [id], onDelete: Cascade)
  eleveId         String
  statutReglement StatutReglement @default(A_REGLER)
  montant         Decimal         @db.Decimal(10, 2)
  pack            Pack?           @relation(fields: [packId], references: [id])
  packId          String?
  paiement        Paiement?

  @@unique([seanceId, eleveId])
}

model Pack {
  id                 String          @id @default(cuid())
  eleve              Eleve           @relation(fields: [eleveId], references: [id], onDelete: Cascade)
  eleveId            String
  nbSeancesTotal     Int
  nbSeancesRestantes Int
  montantPaye        Decimal         @db.Decimal(10, 2)
  dateAchat          DateTime        @default(now())
  participations     Participation[]
  paiement           Paiement?
}

model Paiement {
  id              String          @id @default(cuid())
  montant         Decimal         @db.Decimal(10, 2)
  date            DateTime        @default(now())
  methode         MethodePaiement
  eleve           Eleve           @relation(fields: [eleveId], references: [id], onDelete: Cascade)
  eleveId         String
  participation   Participation?  @relation(fields: [participationId], references: [id])
  participationId String?         @unique
  pack            Pack?           @relation(fields: [packId], references: [id])
  packId          String?         @unique
}
```

- [ ] **Step 2: Vérifier la validité du schéma**

Run :

```bash
npx prisma validate
```

Expected : `The schema is valid 🎉`

- [ ] **Step 3: Créer et appliquer la première migration**

Run :

```bash
npx prisma migrate dev --name init
```

Expected : migration créée dans `prisma/migrations/`, tables créées dans Neon, client Prisma régénéré.

- [ ] **Step 4: Vérifier les tables (optionnel mais recommandé)**

Run :

```bash
npx prisma studio
```

Expected : Prisma Studio s'ouvre et liste les 6 modèles, tous vides. Fermer.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: schéma de données complet (élèves, séances, participations, packs, paiements)"
```

---

### Task 7 : Installer et configurer shadcn/ui

**Files:**

- Create: `components.json`, `components/ui/button.tsx` (et dépendances), `lib/utils.ts`
- Modify: fichiers de config Tailwind/CSS générés par shadcn.

**Interfaces:**

- Produces: composants UI réutilisables (à commencer par `Button`) importables depuis `@/components/ui/*`.

- [ ] **Step 1: Initialiser shadcn/ui**

Run :

```bash
npx shadcn@latest init
```

Réponses : style « New York » (ou défaut), couleur de base au choix (ex. Neutral). Expected : `components.json` et `lib/utils.ts` créés.

- [ ] **Step 2: Ajouter un premier composant**

Run :

```bash
npx shadcn@latest add button
```

Expected : `components/ui/button.tsx` créé.

- [ ] **Step 3: Vérifier que le build passe toujours**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: configurer shadcn/ui avec le composant Button"
```

---

### Task 8 : Structure de traçabilité (`docs/historique/`)

**Files:**

- Create: `docs/historique/CHANGELOG.md`, `docs/historique/adr/0001-stack-nextjs-fullstack.md`, `docs/historique/adr/TEMPLATE.md`

- [ ] **Step 1: Créer le template d'ADR**

Créer `docs/historique/adr/TEMPLATE.md` :

```markdown
# ADR NNNN — <Titre de la décision>

**Date :** YYYY-MM-DD
**Statut :** Proposé | Accepté | Remplacé par ADR-XXXX

## Contexte

<Quel problème / besoin se pose ?>

## Décision

<Quelle option a été choisie ?>

## Alternatives écartées

<Quelles autres options, et pourquoi non retenues ?>

## Conséquences

<Ce que cela implique, bon comme mauvais.>
```

- [ ] **Step 2: Écrire le premier ADR**

Créer `docs/historique/adr/0001-stack-nextjs-fullstack.md` :

```markdown
# ADR 0001 — Stack Next.js full-stack

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Besoin d'un CRM réel, robuste, moderne et sécurisé pour un coach sportif,
construit et maintenu par une seule personne (formation WCS, stack JS/React).

## Décision

Application unique Next.js (App Router, TypeScript) servant front et back,
PostgreSQL (Neon) via Prisma, Auth.js, Tailwind + shadcn/ui, déploiement Vercel.

## Alternatives écartées

- React (Vite) + API Express séparée : deux projets à câbler/déployer, plus de
  plomberie et de sécurité à gérer manuellement.
- Next.js + Supabase tout-en-un : forte dépendance à la logique propre de Supabase.

## Conséquences

- Une seule codebase, sécurité solide par défaut, déploiement simple.
- Nécessite de maîtriser le modèle App Router / Server Actions.
```

- [ ] **Step 3: Créer le changelog**

Créer `docs/historique/CHANGELOG.md` :

```markdown
# Journal de bord — CRM-BB

## 2026-06-18 — Phase 1 : Fondations

- Mise en place du squelette : Next.js + TypeScript + Tailwind + shadcn/ui.
- Prisma + PostgreSQL (Neon), schéma de données complet.
- Vitest, ESLint, Prettier.
- Structure de traçabilité (ADR + changelog).
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: structure de traçabilité (ADR + changelog)"
```

---

### Task 9 : README de démarrage

**Files:**

- Modify/Create: `README.md`

- [ ] **Step 1: Écrire le README**

Remplacer `README.md` par :

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: README de démarrage"
```

---

### Task 10 : Vérification finale de la phase

**Files:** Aucun (vérification).

- [ ] **Step 1: Lint**

Run :

```bash
npm run lint
```

Expected : aucune erreur.

- [ ] **Step 2: Tests**

Run :

```bash
npm run test:run
```

Expected : tous les tests passent.

- [ ] **Step 3: Build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Vérifier l'état Git**

Run :

```bash
git status
```

Expected : arbre propre, `.env` non suivi/ignoré.

La phase 1 est terminée : application qui démarre, base de données connectée avec
le schéma complet, outillage de tests/qualité et traçabilité en place. La fusion de
`feat/fondations` vers `main` se fera selon le workflow choisi (PR ou merge local).

---

## Self-Review

- **Couverture de la spec (§2 stack)** : Next.js/TS/Tailwind (T2), shadcn (T7), Prisma/Postgres (T5), Vitest (T4), ESLint (scaffold T2), Prettier (T3), Vercel → déploiement traité en phase ultérieure (hors phase 1, volontaire).
- **Modèle de données (§3)** : couvert intégralement en T6 (6 modèles + 4 enums + règles de relation).
- **Workflow & traçabilité (§7)** : branche (T1), `docs/historique/` ADR + changelog (T8).
- **Auth, écrans, finances** : hors phase 1 — planifiés en phases 2 à 5 (plans dédiés à écrire le moment venu).
- **Placeholders** : aucun — chaque étape contient commandes/code réels.
- **Cohérence des types** : noms de modèles/enums identiques entre T6 et les phases suivantes (référence : ce schéma).
