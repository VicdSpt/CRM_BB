# Phase 3 — Élèves (CRUD) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gérer les élèves du coach : liste recherchable, fiche détaillée, création, modification, archivage/désarchivage et suppression définitive (RGPD). Toutes les pages et actions sont protégées par l'authentification.

**Architecture:** Pages Server Components (App Router) sous `app/eleves/`, qui lisent les données via Prisma. Les écritures passent par des **Server Actions** validées avec **Zod**. La logique de validation est isolée dans `lib/eleves/` (schéma + helpers purs) couverte par des tests. Un helper `requireCoach()` centralise la garde d'authentification pour chaque page/action. UI mobile-first avec shadcn/ui.

**Tech Stack:** Next.js 16 (App Router, Server Actions), TypeScript strict, Prisma v7 (modèle `Eleve` existant), Zod v4, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur : toutes les routes `/eleves/**` et toutes les Server Actions exigent une session valide (via `requireCoach()`).
- TypeScript strict partout.
- Validation des entrées avec **Zod** côté serveur (jamais faire confiance au client).
- Mobile-first dans toute l'UI.
- Champs élève : `prenom` (obligatoire), `nom` (obligatoire), `telephone`, `email`, `notes` (optionnels). Pas de migration de schéma (le modèle `Eleve` existe déjà).
- Archivage = défaut (champ `archive: boolean`). Suppression définitive = action séparée avec confirmation.
- Secrets uniquement dans `.env`. Git : branche `feat/eleves`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Helper d'authentification `requireCoach()`

**Files:**

- Create: `lib/auth/require-coach.ts`
- Create (ADR): `docs/historique/adr/0005-garde-auth-require-coach.md`

**Interfaces:**

- Consumes: `auth` de `@/auth`.
- Produces: `requireCoach(): Promise<Session>` — renvoie la session si connecté, sinon `redirect("/login")`. À appeler en tête de chaque page/action protégée.

- [ ] **Step 1: Créer le helper**

Créer `lib/auth/require-coach.ts` :

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireCoach() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
```

- [ ] **Step 2: Écrire l'ADR**

Créer `docs/historique/adr/0005-garde-auth-require-coach.md` (format de `docs/historique/adr/TEMPLATE.md`) :

```markdown
# ADR 0005 — Garde d'authentification `requireCoach()`

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Le middleware protège déjà toutes les routes, mais chaque page/Server Action sensible
doit aussi disposer de la session (et échouer sûrement si elle manque) sans répéter la
même logique partout.

## Décision

Un helper unique `requireCoach()` (dans `lib/auth/require-coach.ts`) qui renvoie la session
ou redirige vers `/login`. Appelé en tête de chaque page et Server Action protégée.

## Alternatives écartées

- S'appuyer uniquement sur le middleware : insuffisant pour les Server Actions appelées
  directement, et ne fournit pas l'objet session à la page.
- Répéter `const session = await auth(); if (!session) redirect(...)` partout : duplication.

## Conséquences

- Une seule ligne `await requireCoach()` garde n'importe quelle page/action.
- Point central pour faire évoluer la logique d'accès (rôles élèves plus tard).
```

- [ ] **Step 3: Vérifier la compilation**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add lib/auth/require-coach.ts docs/historique/adr/0005-garde-auth-require-coach.md
git commit -m "feat: helper d'authentification requireCoach + ADR 0005"
```

---

### Task 2 : Schéma de validation des élèves (TDD)

**Files:**

- Create: `lib/eleves/schema.ts`, `lib/eleves/schema.test.ts`

**Interfaces:**

- Produces:
  - `eleveSchema` — schéma Zod : `prenom` (string, trim, min 1), `nom` (string, trim, min 1), `telephone` (string optionnel, vide → undefined), `email` (email optionnel, vide → undefined), `notes` (string optionnel, vide → undefined).
  - `type EleveInput = z.infer<typeof eleveSchema>`.
  - `parseEleveForm(formData: FormData): { success: true; data: EleveInput } | { success: false; errors: Record<string, string> }` — extrait et valide les champs d'un FormData.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/eleves/schema.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { eleveSchema, parseEleveForm } from "./schema";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("eleveSchema", () => {
  it("exige prénom et nom", () => {
    expect(eleveSchema.safeParse({ prenom: "", nom: "" }).success).toBe(false);
  });

  it("accepte un élève minimal (prénom + nom)", () => {
    const r = eleveSchema.safeParse({ prenom: "Jean", nom: "Dupont" });
    expect(r.success).toBe(true);
  });

  it("rejette un email mal formé", () => {
    expect(
      eleveSchema.safeParse({ prenom: "Jean", nom: "Dupont", email: "pas-un-email" }).success,
    ).toBe(false);
  });

  it("transforme une chaîne vide optionnelle en undefined", () => {
    const r = eleveSchema.parse({ prenom: "Jean", nom: "Dupont", telephone: "", email: "" });
    expect(r.telephone).toBeUndefined();
    expect(r.email).toBeUndefined();
  });
});

describe("parseEleveForm", () => {
  it("valide un FormData correct", () => {
    const res = parseEleveForm(fd({ prenom: "Jean", nom: "Dupont", telephone: "0600000000" }));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.prenom).toBe("Jean");
      expect(res.data.telephone).toBe("0600000000");
    }
  });

  it("renvoie des erreurs si prénom/nom manquent", () => {
    const res = parseEleveForm(fd({ prenom: "", nom: "" }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.prenom).toBeTruthy();
      expect(res.errors.nom).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/eleves/schema.test.ts
```

Expected : ÉCHEC — `Cannot find module './schema'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/eleves/schema.ts` :

```typescript
import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const eleveSchema = z.object({
  prenom: z.string().trim().min(1, "Le prénom est obligatoire"),
  nom: z.string().trim().min(1, "Le nom est obligatoire"),
  telephone: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Email invalide").optional()),
  notes: optionalText,
});

export type EleveInput = z.infer<typeof eleveSchema>;

export type ParseResult =
  | { success: true; data: EleveInput }
  | { success: false; errors: Record<string, string> };

export function parseEleveForm(formData: FormData): ParseResult {
  const raw = {
    prenom: String(formData.get("prenom") ?? ""),
    nom: String(formData.get("nom") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = eleveSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/eleves/schema.test.ts
```

Expected : SUCCÈS — 6 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/eleves/schema.ts lib/eleves/schema.test.ts
git commit -m "feat: schéma de validation des élèves (Zod, TDD)"
```

---

### Task 3 : Server Actions élèves (création, modification, archivage, suppression)

**Files:**

- Create: `lib/eleves/actions.ts`

**Interfaces:**

- Consumes: `requireCoach` de `@/lib/auth/require-coach`, `prisma` de `@/lib/prisma`, `parseEleveForm` de `@/lib/eleves/schema`.
- Produces (toutes des Server Actions `"use server"`) :
  - `type EleveFormState = { errors?: Record<string, string>; message?: string }`.
  - `createEleve(prev: EleveFormState, formData: FormData): Promise<EleveFormState>` — valide, crée, puis `redirect("/eleves")`.
  - `updateEleve(id: string, prev: EleveFormState, formData: FormData): Promise<EleveFormState>` — valide, met à jour, puis `redirect("/eleves/" + id)`.
  - `setArchiveEleve(id: string, archive: boolean): Promise<void>` — bascule l'archivage, `revalidatePath`.
  - `deleteEleve(id: string): Promise<void>` — suppression définitive, puis `redirect("/eleves")`.

- [ ] **Step 1: Écrire les Server Actions**

Créer `lib/eleves/actions.ts` :

```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseEleveForm } from "@/lib/eleves/schema";

export type EleveFormState = { errors?: Record<string, string>; message?: string };

export async function createEleve(
  _prev: EleveFormState,
  formData: FormData,
): Promise<EleveFormState> {
  await requireCoach();
  const result = parseEleveForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  await prisma.eleve.create({ data: result.data });
  revalidatePath("/eleves");
  redirect("/eleves");
}

export async function updateEleve(
  id: string,
  _prev: EleveFormState,
  formData: FormData,
): Promise<EleveFormState> {
  await requireCoach();
  const result = parseEleveForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  await prisma.eleve.update({ where: { id }, data: result.data });
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
  redirect(`/eleves/${id}`);
}

export async function setArchiveEleve(id: string, archive: boolean): Promise<void> {
  await requireCoach();
  await prisma.eleve.update({ where: { id }, data: { archive } });
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
}

export async function deleteEleve(id: string): Promise<void> {
  await requireCoach();
  await prisma.eleve.delete({ where: { id } });
  revalidatePath("/eleves");
  redirect("/eleves");
}
```

- [ ] **Step 2: Vérifier la compilation**

Run :

```bash
npm run build
```

Expected : build réussi (les actions ne sont pas encore utilisées par une page — c'est attendu).

- [ ] **Step 3: Commit**

```bash
git add lib/eleves/actions.ts
git commit -m "feat: Server Actions élèves (créer, modifier, archiver, supprimer)"
```

---

### Task 4 : Formulaire élève réutilisable + page de création

**Files:**

- Create: `app/eleves/eleve-form.tsx`, `app/eleves/nouveau/page.tsx`
- Add (shadcn) : `textarea` si absent.

**Interfaces:**

- Consumes: `createEleve`/`updateEleve` + `EleveFormState` de `@/lib/eleves/actions`.
- Produces: composant `<EleveForm action={...} initial={...} submitLabel="..." />` ; page `/eleves/nouveau`.

- [ ] **Step 1: Ajouter le composant shadcn `textarea`**

Run :

```bash
npx shadcn@latest add textarea
```

Expected : `components/ui/textarea.tsx` créé.

- [ ] **Step 2: Créer le formulaire réutilisable (composant client)**

Créer `app/eleves/eleve-form.tsx` :

```tsx
"use client";

import { useActionState } from "react";
import type { EleveFormState } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EleveInitial = {
  prenom?: string;
  nom?: string;
  telephone?: string | null;
  email?: string | null;
  notes?: string | null;
};

type Props = {
  action: (prev: EleveFormState, formData: FormData) => Promise<EleveFormState>;
  initial?: EleveInitial;
  submitLabel: string;
};

export function EleveForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Prénom"
        name="prenom"
        defaultValue={initial?.prenom}
        error={state.errors?.prenom}
        required
      />
      <Field
        label="Nom"
        name="nom"
        defaultValue={initial?.nom}
        error={state.errors?.nom}
        required
      />
      <Field
        label="Téléphone"
        name="telephone"
        defaultValue={initial?.telephone ?? ""}
        error={state.errors?.telephone}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initial?.email ?? ""}
        error={state.errors?.email}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 3: Créer la page de création**

Créer `app/eleves/nouveau/page.tsx` :

```tsx
import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { createEleve } from "@/lib/eleves/actions";
import { EleveForm } from "../eleve-form";

export default async function NouvelElevePage() {
  await requireCoach();
  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Nouvel élève</h1>
      <EleveForm action={createEleve} submitLabel="Créer l'élève" />
    </main>
  );
}
```

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 5: Commit**

```bash
git add app/eleves components/ui/textarea.tsx
git commit -m "feat: formulaire élève réutilisable et page de création"
```

---

### Task 5 : Liste des élèves recherchable

**Files:**

- Create: `app/eleves/page.tsx`, `app/eleves/recherche.tsx`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`.
- Produces: page `/eleves` listant les élèves actifs (non archivés), filtrables par recherche (param `?q=`), avec un lien vers chaque fiche et un bouton « Nouvel élève ». Un interrupteur permet d'afficher les archivés (`?archives=1`).

- [ ] **Step 1: Créer le champ de recherche (composant client)**

Créer `app/eleves/recherche.tsx` :

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function RechercheEleves() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <Input
      type="search"
      placeholder="Rechercher un élève…"
      defaultValue={params.get("q") ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(params);
        if (e.target.value) next.set("q", e.target.value);
        else next.delete("q");
        router.replace(`/eleves?${next.toString()}`);
      }}
    />
  );
}
```

- [ ] **Step 2: Créer la page liste**

Créer `app/eleves/page.tsx` :

```tsx
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { RechercheEleves } from "./recherche";

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archives?: string }>;
}) {
  await requireCoach();
  const { q, archives } = await searchParams;
  const showArchived = archives === "1";

  const where: Prisma.EleveWhereInput = { archive: showArchived };
  if (q) {
    where.OR = [
      { prenom: { contains: q, mode: "insensitive" } },
      { nom: { contains: q, mode: "insensitive" } },
    ];
  }

  const eleves = await prisma.eleve.findMany({
    where,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Élèves</h1>
        <Button asChild>
          <Link href="/eleves/nouveau">Nouvel élève</Link>
        </Button>
      </div>

      <div className="mb-3">
        <RechercheEleves />
      </div>

      <div className="mb-4 text-sm">
        <Link
          href={showArchived ? "/eleves" : "/eleves?archives=1"}
          className="text-muted-foreground underline"
        >
          {showArchived ? "← Voir les élèves actifs" : "Voir les élèves archivés"}
        </Link>
      </div>

      {eleves.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun élève {showArchived ? "archivé" : ""} pour le moment.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {eleves.map((e) => (
            <li key={e.id}>
              <Link
                href={`/eleves/${e.id}`}
                className="hover:bg-muted flex items-center justify-between p-3"
              >
                <span className="font-medium">
                  {e.prenom} {e.nom}
                </span>
                <span className="text-muted-foreground text-sm">{e.telephone ?? ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Test manuel rapide**

Run :

```bash
npm run dev
```

Vérifier (connecté) : `http://localhost:3000/eleves` affiche la liste vide + bouton « Nouvel élève ». Créer un élève via `/eleves/nouveau` → il apparaît dans la liste. Taper dans la recherche filtre la liste. Arrêter le serveur. Noter le résultat dans le rapport.

- [ ] **Step 5: Commit**

```bash
git add app/eleves/page.tsx app/eleves/recherche.tsx
git commit -m "feat: liste des élèves recherchable (actifs/archivés)"
```

---

### Task 6 : Fiche élève (consultation, modification, archivage, suppression)

**Files:**

- Create: `app/eleves/[id]/page.tsx`, `app/eleves/[id]/modifier/page.tsx`, `app/eleves/[id]/actions-eleve.tsx`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`, `updateEleve`/`setArchiveEleve`/`deleteEleve` de `@/lib/eleves/actions`, `EleveForm`.
- Produces: fiche `/eleves/[id]` (infos + boutons archiver/désarchiver, supprimer avec confirmation, lien modifier) ; page d'édition `/eleves/[id]/modifier`.

- [ ] **Step 1: Créer les boutons d'action (composant client)**

Créer `app/eleves/[id]/actions-eleve.tsx` :

```tsx
"use client";

import { setArchiveEleve, deleteEleve } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";

export function ActionsEleve({ id, archive }: { id: string; archive: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={() => setArchiveEleve(id, !archive)}>
        <Button type="submit" variant="outline">
          {archive ? "Désarchiver" : "Archiver"}
        </Button>
      </form>
      <form
        action={() => deleteEleve(id)}
        onSubmit={(e) => {
          if (!confirm("Supprimer définitivement cet élève ? Cette action est irréversible.")) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="destructive">
          Supprimer
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Créer la fiche élève**

Créer `app/eleves/[id]/page.tsx` :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ActionsEleve } from "./actions-eleve";

export default async function FicheElevePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) notFound();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <div className="mt-2 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {eleve.prenom} {eleve.nom}
        </h1>
        <Button asChild variant="outline">
          <Link href={`/eleves/${eleve.id}/modifier`}>Modifier</Link>
        </Button>
      </div>

      {eleve.archive ? (
        <p className="bg-muted mb-4 inline-block rounded px-2 py-1 text-sm">Archivé</p>
      ) : null}

      <dl className="mb-6 flex flex-col gap-2 text-sm">
        <Info label="Téléphone" value={eleve.telephone} />
        <Info label="Email" value={eleve.email} />
        <Info label="Notes" value={eleve.notes} />
      </dl>

      <ActionsEleve id={eleve.id} archive={eleve.archive} />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value ?? "—"}</dd>
    </div>
  );
}
```

- [ ] **Step 3: Créer la page d'édition**

Créer `app/eleves/[id]/modifier/page.tsx` :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { updateEleve, type EleveFormState } from "@/lib/eleves/actions";
import { EleveForm } from "../../eleve-form";

export default async function ModifierElevePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) notFound();

  const action = (prev: EleveFormState, formData: FormData) => updateEleve(id, prev, formData);

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href={`/eleves/${id}`} className="text-muted-foreground text-sm">
        ← Retour à la fiche
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Modifier l'élève</h1>
      <EleveForm action={action} initial={eleve} submitLabel="Enregistrer" />
    </main>
  );
}
```

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 5: Test manuel de bout en bout**

Run :

```bash
npm run dev
```

Vérifier (connecté) :

1. Créer un élève → apparaît dans `/eleves`.
2. Ouvrir sa fiche → infos affichées.
3. « Modifier » → changer un champ → enregistrer → la fiche reflète le changement.
4. « Archiver » → l'élève quitte la liste active, apparaît dans « archivés », badge « Archivé » sur la fiche ; « Désarchiver » le ramène.
5. « Supprimer » → confirmation → l'élève disparaît définitivement de `/eleves`.

Arrêter le serveur. Noter chaque résultat dans le rapport. (Le test navigateur final sera refait par le contrôleur/l'utilisateur.)

- [ ] **Step 6: Commit**

```bash
git add "app/eleves/[id]"
git commit -m "feat: fiche élève (consultation, modification, archivage, suppression)"
```

---

### Task 7 : Lien depuis le tableau de bord + vérification finale + changelog

**Files:**

- Modify: `app/page.tsx` (ajouter un lien vers `/eleves`)
- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Ajouter un lien « Élèves » au tableau de bord**

Dans `app/page.tsx`, ajouter (après le paragraphe de l'email, avant le formulaire de déconnexion) un bouton/lien vers la liste des élèves :

```tsx
import Link from "next/link";
// …
<Button asChild>
  <Link href="/eleves">Gérer les élèves</Link>
</Button>;
```

(Conserver le reste de la page — titre, email de session, bouton de déconnexion.)

- [ ] **Step 2: Lint**

Run :

```bash
npm run lint
```

Expected : aucune erreur.

- [ ] **Step 3: Tests**

Run :

```bash
npm run test:run
```

Expected : tous les tests passent (auth + élèves + smoke).

- [ ] **Step 4: Build**

Run :

```bash
npm run build
```

Expected : build réussi ; routes `/eleves`, `/eleves/nouveau`, `/eleves/[id]`, `/eleves/[id]/modifier` présentes.

- [ ] **Step 5: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-18 — Phase 3 : Élèves (CRUD)

- Liste recherchable des élèves (actifs / archivés).
- Fiche élève ; création, modification.
- Archivage / désarchivage et suppression définitive (RGPD, avec confirmation).
- Pages et Server Actions protégées par `requireCoach()` (ADR 0005).
```

- [ ] **Step 6: État Git**

Run :

```bash
git status
```

Expected : après commit, arbre propre.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx docs/historique/CHANGELOG.md
git commit -m "feat: lien élèves au tableau de bord + changelog phase 3"
```

La phase 3 est terminée : gestion complète des élèves (liste, fiche, création, modification,
archivage, suppression), protégée et validée. Fusion de `feat/eleves` vers `main` via PR après tests.

---

## Self-Review

- **Couverture de la spec (§4.3 Élèves)** : liste recherchable (T5), fiche (T6), ajout (T4), modif (T6), archivage (T6 + actions T3). Création de pack : hors phase 3 (dépend de la phase 5) — volontaire.
- **RGPD / suppression (§5)** : archivage + suppression définitive avec confirmation (T3 actions, T6 UI).
- **Sécurité (§5)** : `requireCoach()` sur chaque page/action (T1 + appels en T3-T6) ; validation Zod serveur (T2 + actions T3).
- **Tests (§6)** : schéma de validation en TDD (T2) ; test manuel e2e (T6).
- **Traçabilité (§7)** : ADR 0005 (T1), changelog (T7).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `EleveFormState` défini en T3 et consommé en T4/T6 ; `parseEleveForm`/`eleveSchema` définis en T2 et consommés en T3 ; `requireCoach` défini en T1 et consommé partout.
- **Note Next 16** : `params` et `searchParams` sont des `Promise` (App Router récent) — le plan les `await` partout, cohérent avec la version utilisée.
