# Phase 2 — Authentification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sécuriser l'application avec une authentification mono-utilisateur (le coach) : connexion email/mot de passe via Auth.js, mots de passe hachés (bcrypt), compte créé par un script de seed depuis `.env`, et protection de toutes les routes par un middleware.

**Architecture:** Auth.js (NextAuth v5) en stratégie de session **JWT** (pas de table de session — le compte coach vit dans le modèle `Coach` déjà présent). La logique sensible (hachage, vérification des identifiants) est isolée dans des fonctions pures testables (`lib/auth/`), que la config Auth.js consomme. Un middleware protège tout sauf la page de login et les routes d'auth. Aucune page d'inscription publique : le coach est créé une fois via `npm run seed`.

**Tech Stack:** Next.js 16 (App Router), Auth.js v5 (`next-auth@beta`), bcryptjs, Zod, TypeScript strict, Vitest, Prisma (modèle `Coach` existant), Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur (le coach) — un seul compte, pas d'inscription publique.
- TypeScript strict partout.
- Mots de passe **jamais en clair** : hachage bcrypt (coût ≥ 10).
- Secrets uniquement dans `.env` (jamais commité) ; `.env.example` documente les variables avec des valeurs factices.
- Validation des entrées avec **Zod** côté serveur.
- Toutes les routes applicatives sont protégées ; seules `/login` et les routes `/api/auth/*` sont publiques.
- Git : on travaille sur la branche `feat/auth`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Dépendances & variables d'environnement

**Files:**

- Modify: `package.json`, `package-lock.json`, `.env`, `.env.example`

**Interfaces:**

- Produces: `next-auth` (v5), `bcryptjs` et ses types installés ; variables `AUTH_SECRET`, `COACH_EMAIL`, `COACH_PASSWORD` disponibles.

- [ ] **Step 1: Installer les dépendances**

Run :

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Générer un secret d'authentification**

Run (génère une valeur aléatoire) :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copier la valeur affichée pour l'étape suivante.

- [ ] **Step 3: Ajouter les variables dans `.env`**

Ajouter à `.env` (remplacer `<valeur>` par le secret généré, et choisir les identifiants du coach) :

```
AUTH_SECRET="<valeur générée à l'étape 2>"
COACH_EMAIL="coach@example.com"
COACH_PASSWORD="UnMotDePasseFort123!"
```

- [ ] **Step 4: Documenter dans `.env.example` (valeurs factices, commité)**

Ajouter à `.env.example` :

```
AUTH_SECRET="genere-avec-node-crypto-randombytes-32-base64"
COACH_EMAIL="coach@example.com"
COACH_PASSWORD="change-moi"
```

- [ ] **Step 5: Confirmer que `.env` reste ignoré**

Run :

```bash
git status --short
```

Expected : `.env` n'apparaît PAS. `.env.example` peut apparaître (modifié).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: dépendances auth (next-auth, bcryptjs) et variables d'environnement"
```

---

### Task 2 : Helpers de mot de passe (TDD)

**Files:**

- Create: `lib/auth/password.ts`, `lib/auth/password.test.ts`

**Interfaces:**

- Produces:
  - `hashPassword(plain: string): Promise<string>` — hache avec bcrypt (coût 12).
  - `verifyPassword(plain: string, hash: string): Promise<boolean>` — compare un mot de passe à un hash.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/auth/password.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hache un mot de passe et le hash diffère du clair", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("mauvais", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/auth/password.test.ts
```

Expected : ÉCHEC — `Cannot find module './password'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/auth/password.ts` :

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/auth/password.test.ts
```

Expected : SUCCÈS — 3 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password.ts lib/auth/password.test.ts
git commit -m "feat: helpers de hachage/vérification de mot de passe (TDD)"
```

---

### Task 3 : Schéma de validation et authentification des identifiants (TDD)

**Files:**

- Create: `lib/auth/credentials.ts`, `lib/auth/credentials.test.ts`

**Interfaces:**

- Consumes: `verifyPassword` de `lib/auth/password.ts`.
- Produces:
  - `credentialsSchema` — schéma Zod `{ email: string (email), password: string (min 1) }`.
  - `type CoachRecord = { id: string; email: string; motDePasse: string; nom: string }`.
  - `authenticateCoach(input: unknown, findCoachByEmail: (email: string) => Promise<CoachRecord | null>): Promise<{ id: string; email: string; nom: string } | null>` — valide l'entrée, cherche le coach, vérifie le mot de passe ; renvoie l'utilisateur sans le hash, ou `null` si invalide.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/auth/credentials.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { authenticateCoach, credentialsSchema } from "./credentials";
import { hashPassword } from "./password";

describe("credentialsSchema", () => {
  it("rejette un email invalide", () => {
    expect(credentialsSchema.safeParse({ email: "pas-un-email", password: "x" }).success).toBe(
      false,
    );
  });

  it("accepte des identifiants bien formés", () => {
    expect(credentialsSchema.safeParse({ email: "coach@test.fr", password: "x" }).success).toBe(
      true,
    );
  });
});

describe("authenticateCoach", () => {
  it("renvoie l'utilisateur (sans hash) quand les identifiants sont valides", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const find = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticateCoach(
      { email: "coach@test.fr", password: "bonmotdepasse" },
      find,
    );
    expect(result).toEqual({ id: "c1", email: "coach@test.fr", nom: "Coach" });
  });

  it("renvoie null si le coach n'existe pas", async () => {
    const find = async () => null;
    const result = await authenticateCoach({ email: "absent@test.fr", password: "x" }, find);
    expect(result).toBeNull();
  });

  it("renvoie null si le mot de passe est faux", async () => {
    const hash = await hashPassword("bonmotdepasse");
    const find = async () => ({
      id: "c1",
      email: "coach@test.fr",
      motDePasse: hash,
      nom: "Coach",
    });
    const result = await authenticateCoach({ email: "coach@test.fr", password: "faux" }, find);
    expect(result).toBeNull();
  });

  it("renvoie null si l'entrée est malformée", async () => {
    const find = async () => null;
    const result = await authenticateCoach({ email: "x", password: "" }, find);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/auth/credentials.test.ts
```

Expected : ÉCHEC — `Cannot find module './credentials'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/auth/credentials.ts` :

```typescript
import { z } from "zod";
import { verifyPassword } from "./password";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CoachRecord = {
  id: string;
  email: string;
  motDePasse: string;
  nom: string;
};

export type AuthenticatedCoach = {
  id: string;
  email: string;
  nom: string;
};

export async function authenticateCoach(
  input: unknown,
  findCoachByEmail: (email: string) => Promise<CoachRecord | null>,
): Promise<AuthenticatedCoach | null> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;

  const coach = await findCoachByEmail(parsed.data.email);
  if (!coach) return null;

  const ok = await verifyPassword(parsed.data.password, coach.motDePasse);
  if (!ok) return null;

  return { id: coach.id, email: coach.email, nom: coach.nom };
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/auth/credentials.test.ts
```

Expected : SUCCÈS — 6 tests passés.

- [ ] **Step 5: Vérifier que `zod` est disponible**

`zod` doit déjà être une dépendance (sinon `npm install zod`). Si l'import échoue à l'étape 4 pour cause de module manquant, lancer `npm install zod` puis recommit en incluant `package.json`/`package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/credentials.ts lib/auth/credentials.test.ts
git commit -m "feat: validation Zod et authentification des identifiants du coach (TDD)"
```

---

### Task 4 : Script de seed du compte coach

**Files:**

- Create: `prisma/seed.ts`
- Modify: `package.json` (script `seed`)

**Interfaces:**

- Consumes: `hashPassword` de `lib/auth/password.ts`, le client Prisma de `lib/prisma.ts`, les variables `COACH_EMAIL` / `COACH_PASSWORD`.
- Produces: un compte `Coach` en base (créé ou mis à jour à l'identique), via `npm run seed`.

- [ ] **Step 1: Écrire le script de seed**

Créer `prisma/seed.ts` :

```typescript
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = process.env.COACH_EMAIL;
  const password = process.env.COACH_PASSWORD;

  if (!email || !password) {
    throw new Error("COACH_EMAIL et COACH_PASSWORD doivent être définis dans .env");
  }

  const motDePasse = await hashPassword(password);

  const coach = await prisma.coach.upsert({
    where: { email },
    update: { motDePasse },
    create: { email, motDePasse, nom: "Coach" },
  });

  console.log(`Compte coach prêt : ${coach.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Ajouter le script `seed` dans `package.json`**

Dans `"scripts"`, ajouter :

```json
"seed": "tsx prisma/seed.ts"
```

- [ ] **Step 3: Installer `tsx` (exécuteur TypeScript)**

Run :

```bash
npm install -D tsx
```

- [ ] **Step 4: Lancer le seed**

Run :

```bash
npm run seed
```

Expected : `Compte coach prêt : coach@example.com` (l'email choisi dans `.env`).

- [ ] **Step 5: Vérifier en base (optionnel)**

Run :

```bash
npx prisma studio
```

Expected : la table `Coach` contient une ligne avec l'email choisi et un `motDePasse` haché (commence par `$2`). Fermer.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: script de seed pour créer le compte coach depuis .env"
```

---

### Task 5 : Configuration Auth.js + route handler

**Files:**

- Create: `auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- Create (ADR): `docs/historique/adr/0003-authjs-credentials-jwt.md`

**Interfaces:**

- Consumes: `authenticateCoach` de `lib/auth/credentials.ts`, `prisma` de `lib/prisma.ts`.
- Produces: exports `handlers`, `auth`, `signIn`, `signOut` depuis `@/auth` ; routes `GET`/`POST` sous `/api/auth/*`.

- [ ] **Step 1: Écrire la configuration Auth.js**

Créer `auth.ts` (à la racine) :

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authenticateCoach } from "@/lib/auth/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const coach = await authenticateCoach(credentials, (email) =>
          prisma.coach.findUnique({ where: { email } }),
        );
        if (!coach) return null;
        return { id: coach.id, email: coach.email, name: coach.nom };
      },
    }),
  ],
});
```

- [ ] **Step 2: Créer le route handler Auth.js**

Créer `app/api/auth/[...nextauth]/route.ts` :

```typescript
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Écrire l'ADR**

Créer `docs/historique/adr/0003-authjs-credentials-jwt.md` (même format que `docs/historique/adr/TEMPLATE.md`) :

```markdown
# ADR 0003 — Auth.js avec Credentials et sessions JWT

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Outil mono-utilisateur (le coach). Besoin d'une connexion sécurisée email/mot de passe,
sans inscription publique, et sans complexité de gestion de sessions en base.

## Décision

Auth.js (NextAuth v5) avec le provider Credentials et la stratégie de session JWT.
La vérification des identifiants délègue à `authenticateCoach` (logique pure, testée).
Le compte coach est créé par un script de seed depuis `.env`.

## Alternatives écartées

- Stratégie de session en base (table Session via l'adaptateur Prisma) : superflue pour
  un seul utilisateur, ajoute des tables et de la complexité.
- Provider OAuth (Google/GitHub) : inutile et lie le compte du coach à un tiers.
- Page d'inscription : risque de sécurité (création de compte ouverte) pour un outil perso.

## Conséquences

- Sessions sans état (JWT signé par AUTH_SECRET), simples et performantes.
- Le changement de mot de passe se fait en relançant le seed.
- Logique d'auth testable indépendamment de NextAuth.
```

- [ ] **Step 4: Vérifier la compilation**

Run :

```bash
npm run build
```

Expected : build réussi. (Si Auth.js v5 exige un fichier `auth.config.ts` séparé pour le edge runtime, suivre le message d'erreur : scinder la config en `auth.config.ts` (providers + pages) importé par `auth.ts` et par le middleware. Documenter l'ajustement dans le rapport.)

- [ ] **Step 5: Commit**

```bash
git add auth.ts "app/api/auth/[...nextauth]/route.ts" docs/historique/adr/0003-authjs-credentials-jwt.md
git commit -m "feat: configuration Auth.js (Credentials + JWT) et route handler"
```

---

### Task 6 : Page de connexion

**Files:**

- Create: `app/login/page.tsx`, `app/login/login-form.tsx`
- Add (shadcn) : composants `input`, `label`, `card` si absents.

**Interfaces:**

- Consumes: `signIn` de `@/auth` (côté serveur via Server Action) OU `signIn` de `next-auth/react` (côté client). Ce plan utilise une **Server Action** qui appelle `signIn` de `@/auth`.
- Produces: une page `/login` fonctionnelle qui authentifie et redirige vers `/`.

- [ ] **Step 1: Ajouter les composants shadcn nécessaires**

Run :

```bash
npx shadcn@latest add input label card
```

Expected : `components/ui/input.tsx`, `label.tsx`, `card.tsx` créés.

- [ ] **Step 2: Créer le formulaire de login (composant client) avec Server Action**

Créer `app/login/login-form.tsx` :

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "./page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Créer la page de login avec la Server Action**

Créer `app/login/page.tsx` :

```tsx
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export type LoginState = { error: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return { error: "" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Email ou mot de passe incorrect." };
  }
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi. (Si l'import `next/dist/client/components/redirect-error` est instable selon la version de Next, remplacer la détection par : `if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error;` et le noter dans le rapport.)

- [ ] **Step 5: Commit**

```bash
git add app/login components/ui
git commit -m "feat: page de connexion (Server Action signIn)"
```

---

### Task 7 : Middleware de protection + page protégée + déconnexion

**Files:**

- Create: `middleware.ts`
- Create: `app/page.tsx` (remplacer la page d'accueil par défaut par un tableau de bord minimal protégé avec déconnexion)

**Interfaces:**

- Consumes: `auth` et `signOut` de `@/auth`.
- Produces: toutes les routes protégées sauf `/login` et `/api/auth/*` ; un bouton de déconnexion fonctionnel.

- [ ] **Step 1: Créer le middleware**

Créer `middleware.ts` (à la racine) :

```typescript
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");

  if (!isLoggedIn && !isOnLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isOnLogin) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Remplacer la page d'accueil par un tableau de bord minimal protégé**

Remplacer le contenu de `app/page.tsx` par :

```tsx
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">CRM-BB</h1>
      <p className="text-muted-foreground">Connecté en tant que {session?.user?.email ?? "—"}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="outline">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi. (Si Next/Auth.js exige `auth.config.ts` séparé pour le middleware edge — voir Task 5 Step 4 — appliquer la scission et le noter.)

- [ ] **Step 4: Test manuel de bout en bout**

Run :

```bash
npm run dev
```

Vérifier dans le navigateur :

1. Aller sur `http://localhost:3000` → redirigé vers `/login`.
2. Saisir un mauvais mot de passe → message « Email ou mot de passe incorrect. ».
3. Saisir les identifiants du seed (`COACH_EMAIL` / `COACH_PASSWORD`) → redirigé vers `/` (tableau de bord, email affiché).
4. Cliquer « Se déconnecter » → retour à `/login`.
5. Re-tenter `http://localhost:3000` → redirigé vers `/login`.

Arrêter avec Ctrl+C. Noter le résultat de chaque étape dans le rapport.

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/page.tsx
git commit -m "feat: middleware de protection des routes, tableau de bord et déconnexion"
```

---

### Task 8 : Vérification finale de la phase

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

Expected : tous les tests passent (helpers password + credentials + smoke test).

- [ ] **Step 3: Build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: État Git & sécurité**

Run :

```bash
git status
git check-ignore .env
```

Expected : arbre propre ; `.env` confirmé ignoré (aucun secret ni `AUTH_SECRET`/mot de passe commité).

- [ ] **Step 5: Mettre à jour le changelog**

Ajouter au début de la section appropriée de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-18 — Phase 2 : Authentification

- Connexion email/mot de passe (Auth.js v5, Credentials, sessions JWT).
- Mots de passe hachés (bcrypt), logique d'auth isolée et testée (TDD).
- Compte coach créé via `npm run seed` depuis `.env` (pas d'inscription publique).
- Middleware protégeant toutes les routes sauf /login ; déconnexion.
```

- [ ] **Step 6: Commit**

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog phase 2 (authentification)"
```

La phase 2 est terminée : l'application est protégée, le coach se connecte avec un compte
créé par seed, et la logique de sécurité est couverte par des tests. Fusion de `feat/auth`
vers `main` via Pull Request après tests.

---

## Self-Review

- **Couverture de la spec (§4.1 Connexion)** : page `/login` (T6), redirection si non connecté (T7 middleware).
- **Sécurité (§5)** : mots de passe hachés bcrypt (T2), sessions Auth.js httpOnly/JWT signées (T5), middleware de protection globale (T7), validation Zod des identifiants (T3), secrets en `.env` non commités (T1, T8).
- **Mono-utilisateur / pas d'inscription** : compte via seed depuis `.env` (T4), aucune route d'inscription.
- **Tests (§6, TDD sur logique sensible)** : helpers password (T2) et authentification (T3) en TDD ; test manuel e2e (T7).
- **Traçabilité (§7)** : ADR 0003 (T5), changelog (T8).
- **Placeholders** : aucun — code complet à chaque étape ; les points d'incertitude liés aux versions (Auth.js v5 `auth.config.ts` edge, détection `NEXT_REDIRECT`) ont une instruction de repli explicite.
- **Cohérence des types** : `authenticateCoach`/`CoachRecord` définis en T3 et consommés en T5 ; `hashPassword` défini en T2 et consommé en T3/T4.
