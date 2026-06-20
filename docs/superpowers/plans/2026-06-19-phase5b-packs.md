# Phase 5b — Packs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gérer les **carnets prépayés (packs)** : sur la fiche élève, créer un pack (ex. 10 séances pour 350 €) — ce qui enregistre un _Paiement_ à l'achat — et voir les séances restantes. Sur une séance, **régler une participation avec un pack** : le système décompte automatiquement le **pack actif le plus ancien** de l'élève (statut → `COUVERT_PAR_PACK`), et permet d'annuler (re-crédite le pack).

**Architecture:** Server Actions gardées par `requireCoach()` dans `lib/finances/actions.ts` (consommation de pack) et une action de création de pack. Les montants **saisis** par le coach sont validés par un schéma Zod qui les conserve en **chaîne décimale** (`string`) jusqu'à Prisma `Decimal` — pas de conversion flottante (note de revue phase 4). Création du pack = `Pack` + son `Paiement` en une transaction atomique. La consommation décrémente `nbSeancesRestantes` ; l'annulation le re-crédite. UI sur la fiche élève (création + liste packs) et la fiche séance (bouton « Pack »).

**Tech Stack:** Next.js 16 (App Router, Server Actions), TypeScript strict, Prisma v7 (modèles `Pack`/`Paiement`/`Participation`/`Eleve` existants), Zod v4, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur : toutes les Server Actions exigent une session (`requireCoach()`).
- TypeScript strict partout.
- Pas de migration de schéma (modèles `Pack`, `Paiement`, `Participation` existent depuis la phase 1).
- Les **montants saisis** sont validés et transmis à Prisma en **`string`** (chaîne décimale ≤ 2 décimales, ≥ 0) — jamais via un flottant JS.
- Consommation de pack = **pack actif le plus ancien** (`dateAchat` croissante) ayant `nbSeancesRestantes > 0`.
- `reglerAvecPack` ne s'applique qu'à une participation `A_REGLER` ; `annulerPack` qu'à une `COUVERT_PAR_PACK`. Actions idempotentes.
- Création d'un pack = créer le `Pack` (`nbSeancesRestantes = nbSeancesTotal`) **et** son `Paiement` (montant = `montantPaye`) en une transaction.
- Secrets uniquement dans `.env`. Git : branche `feat/packs`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Schéma de montant monétaire (string décimale, TDD)

**Files:**

- Create: `lib/finances/money.ts`, `lib/finances/money.test.ts`

**Interfaces:**

- Produces:
  - `montantSchema` — Zod : chaîne décimale `>= 0` avec au plus 2 décimales, renvoyée **en chaîne** (ex. `"350"`, `"15.5"`).
  - `parseMontant(input: unknown): { ok: true; value: string } | { ok: false; error: string }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/finances/money.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { montantSchema, parseMontant } from "./money";

describe("montantSchema", () => {
  it("accepte un entier en chaîne", () => {
    expect(montantSchema.safeParse("350").success).toBe(true);
  });

  it("accepte une décimale à 2 chiffres", () => {
    expect(montantSchema.safeParse("15.50").success).toBe(true);
  });

  it("rejette plus de 2 décimales", () => {
    expect(montantSchema.safeParse("1.999").success).toBe(false);
  });

  it("rejette un négatif", () => {
    expect(montantSchema.safeParse("-5").success).toBe(false);
  });

  it("rejette une valeur non numérique", () => {
    expect(montantSchema.safeParse("abc").success).toBe(false);
  });
});

describe("parseMontant", () => {
  it("renvoie la chaîne validée", () => {
    const r = parseMontant("15.5");
    expect(r).toEqual({ ok: true, value: "15.5" });
  });

  it("renvoie une erreur pour une saisie invalide", () => {
    const r = parseMontant("");
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/money.test.ts
```

Expected : ÉCHEC — `Cannot find module './money'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/finances/money.ts` :

```typescript
import { z } from "zod";

export const montantSchema = z
  .string()
  .trim()
  .refine((s) => /^\d+(\.\d{1,2})?$/.test(s), "Montant invalide (max 2 décimales, positif)");

export function parseMontant(
  input: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  const parsed = montantSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Montant invalide" };
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/finances/money.test.ts
```

Expected : SUCCÈS — 7 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/finances/money.ts lib/finances/money.test.ts
git commit -m "feat: schéma de montant monétaire en chaîne décimale (TDD)"
```

---

### Task 2 : Schéma de pack + Server Action de création (TDD pour le schéma)

**Files:**

- Create: `lib/finances/pack-schema.ts`, `lib/finances/pack-schema.test.ts`
- Modify: `lib/finances/actions.ts` (ajout de `creerPack`)

**Interfaces:**

- Produces:
  - `packSchema` — Zod : `nbSeancesTotal` (int ≥ 1), `montantPaye` (via `montantSchema`, string), `methode` (enum MethodePaiement).
  - `parsePackForm(formData): { success: true; data } | { success: false; errors }`.
  - `creerPack(eleveId: string, prev: PackFormState, formData: FormData): Promise<PackFormState>` — valide, crée `Pack` + `Paiement` en transaction, revalide la fiche élève ; renvoie `{ errors }` ou `{ message }`.

- [ ] **Step 1: Écrire les tests du schéma (qui échouent)**

Créer `lib/finances/pack-schema.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { parsePackForm } from "./pack-schema";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("parsePackForm", () => {
  it("valide un pack correct", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "350", methode: "ESPECES" }));
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.nbSeancesTotal).toBe(10);
      expect(res.data.montantPaye).toBe("350");
      expect(res.data.methode).toBe("ESPECES");
    }
  });

  it("rejette un nombre de séances nul", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "0", montantPaye: "350", methode: "CB" }));
    expect(res.success).toBe(false);
  });

  it("rejette un montant invalide", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "abc", methode: "CB" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.montantPaye).toBeTruthy();
  });

  it("rejette une méthode inconnue", () => {
    const res = parsePackForm(fd({ nbSeancesTotal: "10", montantPaye: "350", methode: "CHEQUE" }));
    expect(res.success).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/pack-schema.test.ts
```

Expected : ÉCHEC — `Cannot find module './pack-schema'`.

- [ ] **Step 3: Écrire le schéma**

Créer `lib/finances/pack-schema.ts` :

```typescript
import { z } from "zod";
import { montantSchema } from "./money";

export const packSchema = z.object({
  nbSeancesTotal: z.coerce.number().int().min(1, "Au moins 1 séance"),
  montantPaye: montantSchema,
  methode: z.enum(["ESPECES", "CB", "VIREMENT"]),
});

export type PackInput = z.infer<typeof packSchema>;

export type PackParseResult =
  | { success: true; data: PackInput }
  | { success: false; errors: Record<string, string> };

export function parsePackForm(formData: FormData): PackParseResult {
  const raw = {
    nbSeancesTotal: String(formData.get("nbSeancesTotal") ?? ""),
    montantPaye: String(formData.get("montantPaye") ?? ""),
    methode: String(formData.get("methode") ?? ""),
  };
  const parsed = packSchema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
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
npm run test:run -- lib/finances/pack-schema.test.ts
```

Expected : SUCCÈS — 4 tests passés.

- [ ] **Step 5: Ajouter `creerPack` dans `lib/finances/actions.ts`**

Ajouter en tête du fichier l'import :

```typescript
import { revalidatePath } from "next/cache";
import { parsePackForm } from "@/lib/finances/pack-schema";
```

(Conserver les imports existants ; `revalidatePath` est déjà importé — ne pas le dupliquer.)

Puis ajouter à la fin du fichier :

```typescript
export type PackFormState = { errors?: Record<string, string>; message?: string };

export async function creerPack(
  eleveId: string,
  _prev: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireCoach();
  const result = parsePackForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { nbSeancesTotal, montantPaye, methode } = result.data;

  await prisma.pack.create({
    data: {
      eleveId,
      nbSeancesTotal,
      nbSeancesRestantes: nbSeancesTotal,
      montantPaye,
      paiement: {
        create: { montant: montantPaye, methode, eleveId },
      },
    },
  });

  revalidatePath(`/eleves/${eleveId}`);
  return { message: "Pack créé." };
}
```

- [ ] **Step 6: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 7: Commit**

```bash
git add lib/finances/pack-schema.ts lib/finances/pack-schema.test.ts lib/finances/actions.ts
git commit -m "feat: schéma pack (TDD) et Server Action de création de pack"
```

---

### Task 3 : Consommation de pack + durcissement double-clic

**Files:**

- Modify: `lib/finances/actions.ts` (ajout `reglerAvecPack`, `annulerPack` ; durcir `marquerPaye`)

**Interfaces:**

- Produces :
  - `reglerAvecPack(participationId: string): Promise<void>` — si `A_REGLER`, décompte le pack actif le plus ancien (`nbSeancesRestantes > 0`) de l'élève et passe la participation à `COUVERT_PAR_PACK` (+ `packId`). No-op si aucun pack dispo.
  - `annulerPack(participationId: string): Promise<void>` — si `COUVERT_PAR_PACK`, re-crédite le pack lié et repasse à `A_REGLER` (+ `packId = null`).
- Modifie `marquerPaye` : ignore proprement l'erreur Prisma `P2002` (double-clic concurrent).

- [ ] **Step 1: Ajouter les actions de pack**

Ajouter à la fin de `lib/finances/actions.ts` :

```typescript
export async function reglerAvecPack(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "A_REGLER") return;

  const pack = await prisma.pack.findFirst({
    where: { eleveId: participation.eleveId, nbSeancesRestantes: { gt: 0 } },
    orderBy: { dateAchat: "asc" },
  });
  if (!pack) return;

  await prisma.$transaction([
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "COUVERT_PAR_PACK", packId: pack.id },
    }),
    prisma.pack.update({
      where: { id: pack.id },
      data: { nbSeancesRestantes: { decrement: 1 } },
    }),
  ]);

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
}

export async function annulerPack(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (
    !participation ||
    participation.statutReglement !== "COUVERT_PAR_PACK" ||
    !participation.packId
  ) {
    return;
  }

  await prisma.$transaction([
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "A_REGLER", packId: null },
    }),
    prisma.pack.update({
      where: { id: participation.packId },
      data: { nbSeancesRestantes: { increment: 1 } },
    }),
  ]);

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
}
```

- [ ] **Step 2: Durcir `marquerPaye` contre le double-clic (P2002)**

Dans `marquerPaye`, entourer le bloc `await prisma.$transaction([...])` d'un `try/catch` qui ignore l'unicité violée :

```typescript
try {
  await prisma.$transaction([
    prisma.paiement.create({
      data: {
        montant: participation.montant,
        methode,
        eleveId: participation.eleveId,
        participationId: participation.id,
      },
    }),
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "PAYE" },
    }),
  ]);
} catch (error) {
  // P2002 = contrainte d'unicité (un paiement existe déjà pour cette participation,
  // ex. double-clic concurrent) → on ignore, l'état final est correct.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return;
  }
  throw error;
}
```

(Conserver les `revalidatePath` après le `try/catch`.)

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add lib/finances/actions.ts
git commit -m "feat: consommation de pack (régler/annuler) + durcissement double-clic paiement"
```

---

### Task 4 : UI packs sur la fiche élève (création + liste)

**Files:**

- Create: `app/eleves/[id]/pack-form.tsx`
- Modify: `app/eleves/[id]/page.tsx`

**Interfaces:**

- Consumes: `creerPack`, `PackFormState`, `formatEuros`.
- Produces: section « Packs » sur la fiche élève (liste des packs avec séances restantes + formulaire de création).

- [ ] **Step 1: Créer le formulaire de pack (client)**

Créer `app/eleves/[id]/pack-form.tsx` :

```tsx
"use client";

import { useActionState } from "react";
import { creerPack, type PackFormState } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PackForm({ eleveId }: { eleveId: string }) {
  const action = creerPack.bind(null, eleveId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border p-3">
      <p className="text-sm font-medium">Nouveau pack</p>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="nbSeancesTotal">Nb séances</Label>
          <Input
            id="nbSeancesTotal"
            name="nbSeancesTotal"
            type="number"
            min={1}
            defaultValue={10}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="montantPaye">Montant (€)</Label>
          <Input id="montantPaye" name="montantPaye" type="number" min={0} step="0.01" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="methode">Méthode</Label>
        <select
          id="methode"
          name="methode"
          defaultValue="ESPECES"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="ESPECES">Espèces</option>
          <option value="CB">CB</option>
          <option value="VIREMENT">Virement</option>
        </select>
      </div>
      {state.errors?.montantPaye ? (
        <p className="text-sm text-red-600">{state.errors.montantPaye}</p>
      ) : null}
      {state.errors?.nbSeancesTotal ? (
        <p className="text-sm text-red-600">{state.errors.nbSeancesTotal}</p>
      ) : null}
      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le pack"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Afficher les packs + le formulaire sur la fiche élève**

Dans `app/eleves/[id]/page.tsx` :

1. Importer en tête :

```tsx
import { formatEuros } from "@/lib/finances/format";
import { PackForm } from "./pack-form";
```

2. Charger les packs (après le calcul `peutSupprimer`) :

```tsx
const packs = await prisma.pack.findMany({
  where: { eleveId: eleve.id },
  orderBy: { dateAchat: "desc" },
});
```

3. Insérer une section « Packs » entre le `</dl>` et le `<ActionsEleve ... />` :

```tsx
<section className="mb-6">
  <h2 className="mb-2 text-sm font-semibold">Packs</h2>
  {packs.length === 0 ? (
    <p className="text-muted-foreground mb-3 text-sm">Aucun pack.</p>
  ) : (
    <ul className="mb-3 divide-y rounded-md border">
      {packs.map((p) => (
        <li key={p.id} className="flex items-center justify-between p-3 text-sm">
          <span>
            {p.nbSeancesRestantes}/{p.nbSeancesTotal} séances restantes
          </span>
          <span className="text-muted-foreground">{formatEuros(p.montantPaye.toString())}</span>
        </li>
      ))}
    </ul>
  )}
  <PackForm eleveId={eleve.id} />
</section>
```

(Conserver le reste de la page inchangé.)

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add "app/eleves/[id]/pack-form.tsx" "app/eleves/[id]/page.tsx"
git commit -m "feat: gestion des packs sur la fiche élève (création + liste)"
```

---

### Task 5 : Bouton « Pack » sur la fiche séance

**Files:**

- Modify: `app/planning/[id]/reglement-participation.tsx`
- Modify: `app/planning/[id]/page.tsx`

**Interfaces:**

- Consumes: `reglerAvecPack`, `annulerPack`.
- Produces: pour une participation `A_REGLER` dont l'élève a un pack disponible → bouton « Pack » ; pour une `COUVERT_PAR_PACK` → libellé + bouton « Annuler ».

- [ ] **Step 1: Étendre `ReglementParticipation`**

Dans `app/planning/[id]/reglement-participation.tsx` :

1. Ajouter à l'import des actions :

```tsx
import { marquerPaye, annulerPaiement, reglerAvecPack, annulerPack } from "@/lib/finances/actions";
```

2. Ajouter la prop `packDisponible` à la signature :

```tsx
export function ReglementParticipation({
  participationId,
  statut,
  methode,
  packDisponible,
}: {
  participationId: string;
  statut: StatutReglement;
  methode: MethodePaiement | null;
  packDisponible: boolean;
}) {
```

3. Remplacer la branche `COUVERT_PAR_PACK` par :

```tsx
if (statut === "COUVERT_PAR_PACK") {
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-blue-700">Couvert par un pack</span>
      <form action={annulerPack.bind(null, participationId)}>
        <Button type="submit" variant="ghost" size="sm">
          Annuler
        </Button>
      </form>
    </span>
  );
}
```

4. Dans la branche par défaut (`A_REGLER`), ajouter le bouton Pack après les boutons de méthode (à l'intérieur du `<span className="flex flex-wrap gap-1">`) :

```tsx
{
  packDisponible ? (
    <form action={reglerAvecPack.bind(null, participationId)}>
      <Button type="submit" variant="outline" size="sm">
        Pack
      </Button>
    </form>
  ) : null;
}
```

- [ ] **Step 2: Calculer `packDisponible` dans la fiche séance**

Dans `app/planning/[id]/page.tsx` (après le chargement de `seance`, avant le rendu) :

```tsx
const eleveIds = seance.participations.map((p) => p.eleveId);
const packsActifs = await prisma.pack.findMany({
  where: { eleveId: { in: eleveIds }, nbSeancesRestantes: { gt: 0 } },
  select: { eleveId: true },
});
const elevesAvecPack = new Set(packsActifs.map((p) => p.eleveId));
```

Puis passer la prop à `ReglementParticipation` :

```tsx
<ReglementParticipation
  participationId={p.id}
  statut={p.statutReglement}
  methode={p.paiement?.methode ?? null}
  packDisponible={elevesAvecPack.has(p.eleveId)}
/>
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /planning` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet sera fait par l'utilisateur.) Noter dans le rapport.

- [ ] **Step 5: Commit**

```bash
git add "app/planning/[id]/reglement-participation.tsx" "app/planning/[id]/page.tsx"
git commit -m "feat: régler une participation avec un pack (décompte auto) sur la fiche séance"
```

---

### Task 6 : ADR + vérification finale + changelog

**Files:**

- Create (ADR): `docs/historique/adr/0008-consommation-pack-plus-ancien.md`
- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Écrire l'ADR**

Créer `docs/historique/adr/0008-consommation-pack-plus-ancien.md` :

```markdown
# ADR 0008 — Consommation automatique du pack le plus ancien

**Date :** 2026-06-19
**Statut :** Accepté

## Contexte

Un élève peut posséder plusieurs packs. Quand on règle une participation « par pack »,
il faut décider quel pack décompter, sans imposer un choix manuel au coach.

## Décision

On décompte automatiquement le pack **actif le plus ancien** (`dateAchat` croissante) ayant
encore des séances (`nbSeancesRestantes > 0`). Les montants saisis (prix de pack) transitent
en chaîne décimale (`string`) jusqu'à Prisma `Decimal` pour éviter tout artefact flottant.

## Alternatives écartées

- Choix manuel du pack à chaque règlement : un clic de plus, inutile dans la quasi-totalité
  des cas (un seul pack actif à la fois).
- Décompter le pack le plus récent : pénaliserait l'ancien, risque d'expiration implicite.

## Conséquences

- Règlement par pack en un clic ; annulation re-crédite le pack consommé.
- Le solde d'un pack ne descend jamais sous 0 (le bouton n'apparaît que si un pack est dispo).
```

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

Expected : tous les tests passent (auth + élèves + planning + finances/format + finances/money + pack-schema + smoke).

- [ ] **Step 4: Build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 5: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-19 — Phase 5b : Packs

- Création de packs prépayés sur la fiche élève (= un paiement à l'achat) ; suivi des séances restantes.
- Régler une participation avec un pack : décompte automatique du pack le plus ancien (ADR 0008) ; annulation re-crédite.
- Montants saisis validés en chaîne décimale (Decimal sans flottant) ; durcissement du double-clic de paiement (P2002).
```

- [ ] **Step 6: Formater et vérifier l'état Git**

Run :

```bash
npm run format
git status
```

Inclure d'éventuels composants shadcn reformatés.

- [ ] **Step 7: Commit**

```bash
git add docs/historique/adr/0008-consommation-pack-plus-ancien.md docs/historique/CHANGELOG.md
git commit -m "docs: ADR 0008 (conso pack) + changelog phase 5b"
```

La sous-phase 5b est terminée : packs prépayés (création = paiement, suivi des séances restantes)
et règlement par décompte automatique du pack le plus ancien. Fusion de `feat/packs` vers `main`
via PR après tests. (Suivra : 5c Tableau de bord finances.)

---

## Self-Review

- **Couverture du périmètre 5b** : créer un pack (T2 + UI T4), suivi séances restantes (T4), régler par pack avec décompte auto du plus ancien (T3 + UI T5), annuler (T3 + UI T5).
- **Sécurité (§5)** : `requireCoach()` sur chaque action (T2, T3) ; montants saisis validés Zod en `string` (T1, T2).
- **Intégrité monétaire** : montants en chaîne décimale jusqu'à Prisma (T1) ; création pack + paiement atomique (T2) ; décompte/recrédit en transaction (T3) ; durcissement P2002 (T3, dette de la revue 5a).
- **Tests (§6)** : schéma montant (T1) et schéma pack (T2) en TDD ; test manuel e2e (T5). _(Dette connue : tests d'intégration des Server Actions de paiement/pack — nécessitent une base de test ; à planifier avant/pendant la 5c.)_
- **Traçabilité (§7)** : ADR 0008 (T6), changelog (T6).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `montantSchema` (T1) consommé par `packSchema` (T2) ; `PackFormState`/`creerPack` (T2) consommés par `PackForm` (T4) ; `reglerAvecPack`/`annulerPack` (T3) consommés par `ReglementParticipation` (T5) ; `formatEuros` (5a) réutilisé (T4).
- **Adaptations connues** : Server Actions liées via `.bind(null, …)` pour les composants client ; `Button` base-ui ; reformatage Prettier des composants.
