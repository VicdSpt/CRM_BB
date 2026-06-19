# Phase 4 — Planning (séances + participations) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gérer le planning du coach : créer/modifier/supprimer des séances (privées ou collectives), y rattacher les élèves participants, changer le statut (planifiée/réalisée/annulée), et consulter l'agenda en vue jour ou semaine (mobile-first). Les paiements/règlements sont hors périmètre (phase 5) : chaque participation est créée « à régler ».

**Architecture:** Pages Server Components sous `app/planning/`, lecture via Prisma. Écritures via **Server Actions** gardées par `requireCoach()` et validées avec **Zod**. La logique pure (calculs de plages de dates, validation) est isolée dans `lib/planning/` et couverte par des tests (TDD). Une séance crée des `Participation` (montant = prix de référence, statut « à régler »). UI mobile-first avec shadcn/ui.

**Tech Stack:** Next.js 16 (App Router, Server Actions), TypeScript strict, Prisma v7 (modèles `Seance`/`Participation`/`Eleve` existants), Zod v4, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur : toutes les routes `/planning/**` et toutes les Server Actions exigent une session valide (via `requireCoach()`).
- TypeScript strict partout.
- Validation des entrées avec **Zod** côté serveur.
- Mobile-first dans toute l'UI.
- Pas de migration de schéma (les modèles `Seance`, `Participation`, enums `TypeSeance`/`StatutSeance` existent depuis la phase 1).
- Montants en `Decimal(10,2)` ; une participation est créée avec `montant = prixReference` de la séance et `statutReglement = A_REGLER` (le marquage payé/pack est en phase 5).
- Cours privé = exactement 1 élève ; cours collectif = au moins 1 élève.
- Semaine commençant le **lundi** (convention FR).
- Secrets uniquement dans `.env`. Git : branche `feat/planning`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Helpers de dates (TDD)

**Files:**

- Create: `lib/planning/dates.ts`, `lib/planning/dates.test.ts`

**Interfaces:**

- Produces (toutes pures, en heure locale) :
  - `startOfDay(d: Date): Date`
  - `endOfDay(d: Date): Date`
  - `addDays(d: Date, n: number): Date`
  - `startOfWeek(d: Date): Date` — lundi 00:00:00.000
  - `endOfWeek(d: Date): Date` — dimanche 23:59:59.999
  - `eachDayOfWeek(d: Date): Date[]` — 7 dates (lundi → dimanche)

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/planning/dates.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, eachDayOfWeek } from "./dates";

describe("helpers de dates", () => {
  it("startOfDay met l'heure à 00:00:00.000", () => {
    const r = startOfDay(new Date(2026, 5, 20, 14, 30, 15, 500));
    expect([r.getHours(), r.getMinutes(), r.getSeconds(), r.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);
    expect(r.getDate()).toBe(20);
  });

  it("endOfDay met l'heure à 23:59:59.999", () => {
    const r = endOfDay(new Date(2026, 5, 20, 1, 0, 0, 0));
    expect([r.getHours(), r.getMinutes(), r.getSeconds(), r.getMilliseconds()]).toEqual([
      23, 59, 59, 999,
    ]);
  });

  it("addDays ajoute des jours", () => {
    const r = addDays(new Date(2026, 5, 20), 5);
    expect(r.getDate()).toBe(25);
  });

  it("startOfWeek renvoie le lundi 00:00 (samedi 2026-06-20 -> lundi 2026-06-15)", () => {
    const r = startOfWeek(new Date(2026, 5, 20)); // 20 juin 2026 = samedi
    expect(r.getFullYear()).toBe(2026);
    expect(r.getMonth()).toBe(5);
    expect(r.getDate()).toBe(15); // lundi
    expect(r.getHours()).toBe(0);
  });

  it("startOfWeek pour un lundi renvoie le même jour", () => {
    const r = startOfWeek(new Date(2026, 5, 15)); // lundi
    expect(r.getDate()).toBe(15);
  });

  it("startOfWeek pour un dimanche renvoie le lundi précédent", () => {
    const r = startOfWeek(new Date(2026, 5, 21)); // dimanche
    expect(r.getDate()).toBe(15);
  });

  it("endOfWeek renvoie le dimanche 23:59:59.999", () => {
    const r = endOfWeek(new Date(2026, 5, 20));
    expect(r.getDate()).toBe(21); // dimanche
    expect(r.getHours()).toBe(23);
    expect(r.getMinutes()).toBe(59);
  });

  it("eachDayOfWeek renvoie 7 jours du lundi au dimanche", () => {
    const days = eachDayOfWeek(new Date(2026, 5, 20));
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(15); // lundi
    expect(days[6].getDate()).toBe(21); // dimanche
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/planning/dates.test.ts
```

Expected : ÉCHEC — `Cannot find module './dates'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/planning/dates.ts` :

```typescript
export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  const day = r.getDay(); // 0 = dimanche, 1 = lundi, ...
  const diff = (day + 6) % 7; // nb de jours depuis lundi
  return addDays(r, -diff);
}

export function endOfWeek(d: Date): Date {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function eachDayOfWeek(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/planning/dates.test.ts
```

Expected : SUCCÈS — 8 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/planning/dates.ts lib/planning/dates.test.ts
git commit -m "feat: helpers de dates du planning (TDD)"
```

---

### Task 2 : Schéma de validation des séances (TDD)

**Files:**

- Create: `lib/planning/schema.ts`, `lib/planning/schema.test.ts`

**Interfaces:**

- Produces:
  - `seanceSchema` — Zod : `type` (PRIVE|COLLECTIF), `dateHeureDebut` (Date, coercé), `dureeMinutes` (int ≥ 1), `lieu` (optionnel), `prixReference` (number ≥ 0), `eleveIds` (string[] ≥ 1) ; raffinement : si `type === "PRIVE"` alors `eleveIds.length === 1`.
  - `type SeanceInput = z.infer<typeof seanceSchema>`.
  - `parseSeanceForm(formData: FormData): { success: true; data: SeanceInput } | { success: false; errors: Record<string, string> }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/planning/schema.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { seanceSchema, parseSeanceForm } from "./schema";

function fd(entries: Array<[string, string]>): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

describe("seanceSchema", () => {
  const base = {
    type: "COLLECTIF" as const,
    dateHeureDebut: new Date(2026, 5, 20, 18, 0),
    dureeMinutes: 60,
    prixReference: 15,
    eleveIds: ["e1", "e2"],
  };

  it("accepte une séance collective valide", () => {
    expect(seanceSchema.safeParse(base).success).toBe(true);
  });

  it("rejette une durée nulle ou négative", () => {
    expect(seanceSchema.safeParse({ ...base, dureeMinutes: 0 }).success).toBe(false);
  });

  it("rejette un prix négatif", () => {
    expect(seanceSchema.safeParse({ ...base, prixReference: -5 }).success).toBe(false);
  });

  it("rejette une séance sans élève", () => {
    expect(seanceSchema.safeParse({ ...base, eleveIds: [] }).success).toBe(false);
  });

  it("rejette un cours privé avec 2 élèves", () => {
    expect(seanceSchema.safeParse({ ...base, type: "PRIVE", eleveIds: ["e1", "e2"] }).success).toBe(
      false,
    );
  });

  it("accepte un cours privé avec exactement 1 élève", () => {
    expect(seanceSchema.safeParse({ ...base, type: "PRIVE", eleveIds: ["e1"] }).success).toBe(true);
  });
});

describe("parseSeanceForm", () => {
  it("valide un FormData correct (plusieurs eleveIds)", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "COLLECTIF"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["lieu", "Salle A"],
        ["prixReference", "15"],
        ["eleveIds", "e1"],
        ["eleveIds", "e2"],
      ]),
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.eleveIds).toEqual(["e1", "e2"]);
      expect(res.data.type).toBe("COLLECTIF");
      expect(res.data.dureeMinutes).toBe(60);
    }
  });

  it("renvoie une erreur si aucun élève sélectionné", () => {
    const res = parseSeanceForm(
      fd([
        ["type", "COLLECTIF"],
        ["dateHeureDebut", "2026-06-20T18:00"],
        ["dureeMinutes", "60"],
        ["prixReference", "15"],
      ]),
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.errors.eleveIds).toBeTruthy();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/planning/schema.test.ts
```

Expected : ÉCHEC — `Cannot find module './schema'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/planning/schema.ts` :

```typescript
import { z } from "zod";

export const seanceSchema = z
  .object({
    type: z.enum(["PRIVE", "COLLECTIF"]),
    dateHeureDebut: z.coerce.date(),
    dureeMinutes: z.coerce.number().int().min(1, "La durée doit être positive"),
    lieu: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    prixReference: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
    eleveIds: z.array(z.string().min(1)).min(1, "Sélectionnez au moins un élève"),
  })
  .refine((v) => v.type !== "PRIVE" || v.eleveIds.length === 1, {
    message: "Un cours privé doit avoir exactement un élève",
    path: ["eleveIds"],
  });

export type SeanceInput = z.infer<typeof seanceSchema>;

export type ParseResult =
  | { success: true; data: SeanceInput }
  | { success: false; errors: Record<string, string> };

export function parseSeanceForm(formData: FormData): ParseResult {
  const raw = {
    type: String(formData.get("type") ?? ""),
    dateHeureDebut: String(formData.get("dateHeureDebut") ?? ""),
    dureeMinutes: String(formData.get("dureeMinutes") ?? ""),
    lieu: String(formData.get("lieu") ?? ""),
    prixReference: String(formData.get("prixReference") ?? ""),
    eleveIds: formData.getAll("eleveIds").map((v) => String(v)),
  };
  const parsed = seanceSchema.safeParse(raw);
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
npm run test:run -- lib/planning/schema.test.ts
```

Expected : SUCCÈS — 8 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/planning/schema.ts lib/planning/schema.test.ts
git commit -m "feat: schéma de validation des séances (Zod, TDD)"
```

---

### Task 3 : Server Actions séances

**Files:**

- Create: `lib/planning/actions.ts`
- Create (ADR): `docs/historique/adr/0006-dates-planning-fuseau-unique.md`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`, `parseSeanceForm`.
- Produces (Server Actions `"use server"`) :
  - `type SeanceFormState = { errors?: Record<string, string>; message?: string }`.
  - `createSeance(prev, formData): Promise<SeanceFormState>` — valide, crée la séance + ses participations (`montant = prixReference`, statut « à régler »), redirige vers `/planning`.
  - `updateSeance(id, prev, formData): Promise<SeanceFormState>` — valide, met à jour les champs, réconcilie les participants (ajoute les nouveaux, retire ceux décochés), redirige vers `/planning/{id}`.
  - `setStatutSeance(id, statut): Promise<void>` — change le statut (PLANIFIEE|REALISEE|ANNULEE).
  - `deleteSeance(id): Promise<void>` — supprime (cascade participations), redirige vers `/planning`.

- [ ] **Step 1: Écrire l'ADR (dates / fuseau unique)**

Créer `docs/historique/adr/0006-dates-planning-fuseau-unique.md` (format de `docs/historique/adr/TEMPLATE.md`) :

```markdown
# ADR 0006 — Gestion des dates du planning (entrées locales, fuseau unique)

**Date :** 2026-06-19
**Statut :** Accepté

## Contexte

Le coach saisit des séances avec date + heure. L'outil est mono-utilisateur, utilisé
dans un seul fuseau horaire. Il faut éviter la complexité d'une gestion multi-fuseaux.

## Décision

Les dates sont saisies via `<input type="datetime-local">` (heure locale) et stockées en
`DateTime` Postgres. Les calculs de plages (jour/semaine) se font en heure locale du
serveur via des helpers purs testés (`lib/planning/dates.ts`). On suppose un fuseau unique.

## Alternatives écartées

- Stockage et affichage en UTC avec conversions explicites par fuseau : superflu pour un
  usage mono-coach mono-fuseau.
- Bibliothèque de dates (date-fns, Luxon) : non nécessaire pour ces quelques calculs ;
  on garde des helpers maison légers et testés.

## Conséquences

- Simplicité maximale tant que le coach reste dans un seul fuseau.
- Si un déploiement serveur dans un autre fuseau pose souci, fixer `TZ` côté serveur ou
  introduire une conversion explicite (à réévaluer le moment venu).
```

- [ ] **Step 2: Écrire les Server Actions**

Créer `lib/planning/actions.ts` :

```typescript
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { StatutSeance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseSeanceForm } from "@/lib/planning/schema";

export type SeanceFormState = { errors?: Record<string, string>; message?: string };

export async function createSeance(
  _prev: SeanceFormState,
  formData: FormData,
): Promise<SeanceFormState> {
  await requireCoach();
  const result = parseSeanceForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { eleveIds, prixReference, ...seanceData } = result.data;
  await prisma.seance.create({
    data: {
      ...seanceData,
      prixReference,
      participations: {
        create: eleveIds.map((eleveId) => ({ eleveId, montant: prixReference })),
      },
    },
  });
  revalidatePath("/planning");
  redirect("/planning");
}

export async function updateSeance(
  id: string,
  _prev: SeanceFormState,
  formData: FormData,
): Promise<SeanceFormState> {
  await requireCoach();
  const result = parseSeanceForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { eleveIds, prixReference, ...seanceData } = result.data;

  const existing = await prisma.participation.findMany({
    where: { seanceId: id },
    select: { eleveId: true },
  });
  const existingIds = new Set(existing.map((p) => p.eleveId));
  const nextIds = new Set(eleveIds);
  const toAdd = eleveIds.filter((e) => !existingIds.has(e));
  const toRemove = [...existingIds].filter((e) => !nextIds.has(e));

  await prisma.$transaction([
    prisma.seance.update({ where: { id }, data: { ...seanceData, prixReference } }),
    prisma.participation.deleteMany({ where: { seanceId: id, eleveId: { in: toRemove } } }),
    ...toAdd.map((eleveId) =>
      prisma.participation.create({ data: { seanceId: id, eleveId, montant: prixReference } }),
    ),
  ]);

  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
  redirect(`/planning/${id}`);
}

export async function setStatutSeance(id: string, statut: StatutSeance): Promise<void> {
  await requireCoach();
  await prisma.seance.update({ where: { id }, data: { statut } });
  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
}

export async function deleteSeance(id: string): Promise<void> {
  await requireCoach();
  await prisma.seance.delete({ where: { id } });
  revalidatePath("/planning");
  redirect("/planning");
}
```

- [ ] **Step 3: Vérifier la compilation**

Run :

```bash
npm run build
```

Expected : build réussi (actions pas encore utilisées par une page — attendu).

- [ ] **Step 4: Commit**

```bash
git add lib/planning/actions.ts docs/historique/adr/0006-dates-planning-fuseau-unique.md
git commit -m "feat: Server Actions séances + ADR 0006 (dates planning)"
```

---

### Task 4 : Formulaire de séance réutilisable + page de création

**Files:**

- Create: `app/planning/seance-form.tsx`, `app/planning/nouvelle/page.tsx`

**Interfaces:**

- Consumes: `createSeance`/`updateSeance` + `SeanceFormState`, la liste des élèves actifs (props).
- Produces: composant `<SeanceForm action eleves initial submitLabel />` ; page `/planning/nouvelle`.

- [ ] **Step 1: Créer le formulaire réutilisable (composant client)**

Créer `app/planning/seance-form.tsx` :

```tsx
"use client";

import { useActionState } from "react";
import type { SeanceFormState } from "@/lib/planning/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EleveOption = { id: string; prenom: string; nom: string };

type SeanceInitial = {
  type?: "PRIVE" | "COLLECTIF";
  dateHeureDebutLocal?: string; // format datetime-local "YYYY-MM-DDTHH:mm"
  dureeMinutes?: number;
  lieu?: string | null;
  prixReference?: number | string;
  eleveIds?: string[];
};

type Props = {
  action: (prev: SeanceFormState, formData: FormData) => Promise<SeanceFormState>;
  eleves: EleveOption[];
  initial?: SeanceInitial;
  submitLabel: string;
};

export function SeanceForm({ action, eleves, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const selected = new Set(initial?.eleveIds ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={initial?.type ?? "PRIVE"}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="PRIVE">Cours privé</option>
          <option value="COLLECTIF">Cours collectif</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateHeureDebut">Date et heure</Label>
        <Input
          id="dateHeureDebut"
          name="dateHeureDebut"
          type="datetime-local"
          defaultValue={initial?.dateHeureDebutLocal}
          required
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="dureeMinutes">Durée (min)</Label>
          <Input
            id="dureeMinutes"
            name="dureeMinutes"
            type="number"
            min={1}
            defaultValue={initial?.dureeMinutes ?? 60}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="prixReference">Prix (€)</Label>
          <Input
            id="prixReference"
            name="prixReference"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.prixReference?.toString() ?? "0"}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lieu">Lieu</Label>
        <Input id="lieu" name="lieu" defaultValue={initial?.lieu ?? ""} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Élèves</legend>
        {eleves.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun élève actif. Ajoutez d&apos;abord un élève.
          </p>
        ) : (
          eleves.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="eleveIds"
                value={e.id}
                defaultChecked={selected.has(e.id)}
              />
              {e.prenom} {e.nom}
            </label>
          ))
        )}
        {state.errors?.eleveIds ? (
          <p className="text-sm text-red-600">{state.errors.eleveIds}</p>
        ) : null}
      </fieldset>

      {state.errors?.dureeMinutes ? (
        <p className="text-sm text-red-600">{state.errors.dureeMinutes}</p>
      ) : null}
      {state.errors?.prixReference ? (
        <p className="text-sm text-red-600">{state.errors.prixReference}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Créer la page de création**

Créer `app/planning/nouvelle/page.tsx` :

```tsx
import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { createSeance } from "@/lib/planning/actions";
import { SeanceForm } from "../seance-form";

export default async function NouvelleSeancePage() {
  await requireCoach();
  const eleves = await prisma.eleve.findMany({
    where: { archive: false },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    select: { id: true, prenom: true, nom: true },
  });

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/planning" className="text-muted-foreground text-sm">
        ← Retour au planning
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Nouvelle séance</h1>
      <SeanceForm action={createSeance} eleves={eleves} submitLabel="Créer la séance" />
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

- [ ] **Step 4: Commit**

```bash
git add app/planning/seance-form.tsx app/planning/nouvelle/page.tsx
git commit -m "feat: formulaire de séance réutilisable et page de création"
```

---

### Task 5 : Page planning (vue jour / semaine)

**Files:**

- Create: `app/planning/page.tsx`, `app/planning/navigation.tsx`, `lib/planning/format.ts`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`, helpers `dates.ts`.
- Produces: page `/planning` (param `?date=YYYY-MM-DD&vue=jour|semaine`) affichant les séances de la période, groupées par jour, triées par heure ; navigation précédent/suivant ; bascule jour/semaine ; bouton « Nouvelle séance ».
- `lib/planning/format.ts` : `formatJourFr(d: Date): string` (ex. « samedi 20 juin »), `formatHeureFr(d: Date): string` (ex. « 18:00 »), `toDateParam(d: Date): string` (YYYY-MM-DD), `parseDateParam(s?: string): Date` (param → Date locale, défaut aujourd'hui).

- [ ] **Step 1: Créer les helpers de formatage**

Créer `lib/planning/format.ts` :

```typescript
export function formatJourFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function formatHeureFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function toDateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateParam(s?: string): Date {
  if (s) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}
```

- [ ] **Step 2: Créer le composant de navigation (client)**

Créer `app/planning/navigation.tsx` :

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  vue: "jour" | "semaine";
  prevParam: string;
  nextParam: string;
  todayParam: string;
};

export function PlanningNavigation({ vue, prevParam, nextParam, todayParam }: Props) {
  const router = useRouter();
  const go = (date: string, v: "jour" | "semaine") =>
    router.push(`/planning?date=${date}&vue=${v}`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => go(prevParam, vue)}>
          ←
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(todayParam, vue)}>
          Aujourd&apos;hui
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(nextParam, vue)}>
          →
        </Button>
      </div>
      <div className="flex gap-1">
        <Button
          variant={vue === "jour" ? "default" : "outline"}
          size="sm"
          onClick={() => go(todayParam, "jour")}
        >
          Jour
        </Button>
        <Button
          variant={vue === "semaine" ? "default" : "outline"}
          size="sm"
          onClick={() => go(todayParam, "semaine")}
        >
          Semaine
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Créer la page planning**

Créer `app/planning/page.tsx` :

```tsx
import Link from "next/link";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  eachDayOfWeek,
} from "@/lib/planning/dates";
import { formatJourFr, formatHeureFr, toDateParam, parseDateParam } from "@/lib/planning/format";
import { PlanningNavigation } from "./navigation";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vue?: string }>;
}) {
  await requireCoach();
  const { date, vue: vueParam } = await searchParams;
  const vue = vueParam === "semaine" ? "semaine" : "jour";
  const ref = parseDateParam(date);

  const debut = vue === "semaine" ? startOfWeek(ref) : startOfDay(ref);
  const fin = vue === "semaine" ? endOfWeek(ref) : endOfDay(ref);

  const seances = await prisma.seance.findMany({
    where: { dateHeureDebut: { gte: debut, lte: fin } },
    orderBy: { dateHeureDebut: "asc" },
    include: { participations: { include: { eleve: true } } },
  });

  const jours = vue === "semaine" ? eachDayOfWeek(ref) : [startOfDay(ref)];

  const prevParam = toDateParam(addDays(ref, vue === "semaine" ? -7 : -1));
  const nextParam = toDateParam(addDays(ref, vue === "semaine" ? 7 : 1));
  const todayParam = toDateParam(new Date());

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Planning</h1>
        <Button render={<Link href="/planning/nouvelle" />}>Nouvelle séance</Button>
      </div>

      <div className="mb-4">
        <PlanningNavigation
          vue={vue}
          prevParam={prevParam}
          nextParam={nextParam}
          todayParam={todayParam}
        />
      </div>

      <div className="flex flex-col gap-6">
        {jours.map((jour) => {
          const duJour = seances.filter(
            (s) => s.dateHeureDebut >= startOfDay(jour) && s.dateHeureDebut <= endOfDay(jour),
          );
          return (
            <section key={jour.toISOString()}>
              <h2 className="text-muted-foreground mb-2 text-sm font-semibold capitalize">
                {formatJourFr(jour)}
              </h2>
              {duJour.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucune séance.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {duJour.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/planning/${s.id}`}
                        className="hover:bg-muted flex items-center justify-between rounded-md border p-3"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">
                            {formatHeureFr(s.dateHeureDebut)} ·{" "}
                            {s.type === "PRIVE" ? "Privé" : "Collectif"}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {s.participations.map((p) => p.eleve.prenom).join(", ") ||
                              "Aucun élève"}
                          </span>
                        </span>
                        <StatutBadge statut={s.statut} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function StatutBadge({ statut }: { statut: "PLANIFIEE" | "REALISEE" | "ANNULEE" }) {
  const label =
    statut === "PLANIFIEE" ? "Planifiée" : statut === "REALISEE" ? "Réalisée" : "Annulée";
  return <span className="bg-muted rounded px-2 py-0.5 text-xs">{label}</span>;
}
```

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 5: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /planning` → redirection 307 vers `/login`. Arrêter le serveur. Noter dans le rapport.

- [ ] **Step 6: Commit**

```bash
git add app/planning/page.tsx app/planning/navigation.tsx lib/planning/format.ts
git commit -m "feat: page planning (vue jour/semaine, navigation)"
```

---

### Task 6 : Fiche séance (consultation, statut, modification, suppression)

**Files:**

- Create: `app/planning/[id]/page.tsx`, `app/planning/[id]/modifier/page.tsx`, `app/planning/[id]/actions-seance.tsx`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`, `setStatutSeance`/`deleteSeance`/`updateSeance`, `SeanceForm`, helpers de format.
- Produces: fiche `/planning/[id]` (infos, participants, boutons statut, supprimer, lien modifier) ; page d'édition `/planning/[id]/modifier`.

- [ ] **Step 1: Créer les boutons d'action (composant client)**

Créer `app/planning/[id]/actions-seance.tsx` :

```tsx
"use client";

import { setStatutSeance, deleteSeance } from "@/lib/planning/actions";
import { Button } from "@/components/ui/button";

export function ActionsSeance({
  id,
  statut,
}: {
  id: string;
  statut: "PLANIFIEE" | "REALISEE" | "ANNULEE";
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={() => setStatutSeance(id, "REALISEE")}>
          <Button type="submit" variant={statut === "REALISEE" ? "default" : "outline"} size="sm">
            Réalisée
          </Button>
        </form>
        <form action={() => setStatutSeance(id, "ANNULEE")}>
          <Button type="submit" variant={statut === "ANNULEE" ? "default" : "outline"} size="sm">
            Annulée
          </Button>
        </form>
        <form action={() => setStatutSeance(id, "PLANIFIEE")}>
          <Button type="submit" variant={statut === "PLANIFIEE" ? "default" : "outline"} size="sm">
            Planifiée
          </Button>
        </form>
      </div>
      <form
        action={() => deleteSeance(id)}
        onSubmit={(e) => {
          if (!confirm("Supprimer définitivement cette séance ?")) e.preventDefault();
        }}
      >
        <Button type="submit" variant="destructive" size="sm">
          Supprimer la séance
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Créer la fiche séance**

Créer `app/planning/[id]/page.tsx` :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatJourFr, formatHeureFr } from "@/lib/planning/format";
import { ActionsSeance } from "./actions-seance";

export default async function FicheSeancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const seance = await prisma.seance.findUnique({
    where: { id },
    include: { participations: { include: { eleve: true } } },
  });
  if (!seance) notFound();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href="/planning" className="text-muted-foreground text-sm">
        ← Retour au planning
      </Link>
      <div className="mt-2 mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold capitalize">
          {seance.type === "PRIVE" ? "Cours privé" : "Cours collectif"}
        </h1>
        <Button variant="outline" render={<Link href={`/planning/${seance.id}/modifier`} />}>
          Modifier
        </Button>
      </div>

      <dl className="mb-6 flex flex-col gap-2 text-sm">
        <Info
          label="Date"
          value={`${formatJourFr(seance.dateHeureDebut)} à ${formatHeureFr(seance.dateHeureDebut)}`}
        />
        <Info label="Durée" value={`${seance.dureeMinutes} min`} />
        <Info label="Lieu" value={seance.lieu} />
        <Info label="Prix" value={`${seance.prixReference.toString()} €`} />
      </dl>

      <h2 className="mb-2 text-sm font-semibold">Élèves ({seance.participations.length})</h2>
      <ul className="mb-6 divide-y rounded-md border">
        {seance.participations.map((p) => (
          <li key={p.id} className="flex items-center justify-between p-3 text-sm">
            <Link href={`/eleves/${p.eleveId}`} className="font-medium hover:underline">
              {p.eleve.prenom} {p.eleve.nom}
            </Link>
            <span className="text-muted-foreground">{p.montant.toString()} € · à régler</span>
          </li>
        ))}
      </ul>

      <ActionsSeance id={seance.id} statut={seance.statut} />
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

Créer `app/planning/[id]/modifier/page.tsx` :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { updateSeance } from "@/lib/planning/actions";
import { toDateParam } from "@/lib/planning/format";
import { SeanceForm } from "../../seance-form";

function toDatetimeLocal(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${toDateParam(d)}T${h}:${min}`;
}

export default async function ModifierSeancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireCoach();
  const { id } = await params;
  const seance = await prisma.seance.findUnique({
    where: { id },
    include: { participations: { select: { eleveId: true } } },
  });
  if (!seance) notFound();

  const eleves = await prisma.eleve.findMany({
    where: { archive: false },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    select: { id: true, prenom: true, nom: true },
  });

  const action = updateSeance.bind(null, id);
  const initial = {
    type: seance.type,
    dateHeureDebutLocal: toDatetimeLocal(seance.dateHeureDebut),
    dureeMinutes: seance.dureeMinutes,
    lieu: seance.lieu,
    prixReference: seance.prixReference.toString(),
    eleveIds: seance.participations.map((p) => p.eleveId),
  };

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <Link href={`/planning/${id}`} className="text-muted-foreground text-sm">
        ← Retour à la séance
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Modifier la séance</h1>
      <SeanceForm action={action} eleves={eleves} initial={initial} submitLabel="Enregistrer" />
    </main>
  );
}
```

- [ ] **Step 4: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi ; routes `/planning/[id]` et `/planning/[id]/modifier` présentes.

- [ ] **Step 5: Commit**

```bash
git add "app/planning/[id]"
git commit -m "feat: fiche séance (consultation, statut, modification, suppression)"
```

---

### Task 7 : Lien tableau de bord + vérification finale + changelog

**Files:**

- Modify: `app/page.tsx` (ajouter un lien vers `/planning`)
- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Ajouter un lien « Planning » au tableau de bord**

Dans `app/page.tsx`, ajouter (à côté du lien « Gérer les élèves », avant le formulaire de déconnexion) :

```tsx
<Button render={<Link href="/planning" />}>Planning</Button>
```

(Conserver tout le reste — titre, email, lien élèves, déconnexion. `Link` est déjà importé.)

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

Expected : tous les tests passent (auth + élèves + planning dates/schema + smoke).

- [ ] **Step 4: Build**

Run :

```bash
npm run build
```

Expected : build réussi ; routes `/planning`, `/planning/nouvelle`, `/planning/[id]`, `/planning/[id]/modifier` présentes.

- [ ] **Step 5: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-19 — Phase 4 : Planning (séances)

- Création/modification/suppression de séances (privées / collectives).
- Rattachement des élèves participants ; statut planifiée / réalisée / annulée.
- Agenda vue jour / semaine (mobile-first) avec navigation.
- Pages et Server Actions protégées par `requireCoach()` ; helpers de dates testés (TDD).
```

- [ ] **Step 6: Vérifier l'état Git, formater si besoin**

Run :

```bash
npm run format
git status
```

Si `npm run format` a modifié des composants shadcn non formatés, les inclure dans le commit.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx docs/historique/CHANGELOG.md
git commit -m "feat: lien planning au tableau de bord + changelog phase 4"
```

La phase 4 est terminée : planning complet (séances privées/collectives, participants, statut,
vues jour/semaine). Fusion de `feat/planning` vers `main` via PR après tests.

---

## Self-Review

- **Couverture de la spec (§4.2 Planning)** : vue agenda jour/semaine (T5), création séance type/date/durée/lieu/prix + élèves (T4), marquer réalisée/annulée (T6). Le règlement par élève (payé cash / pack) : volontairement hors phase 4 (phase 5) — chaque participation est « à régler ».
- **Sécurité (§5)** : `requireCoach()` sur chaque page/action (T3-T6) ; validation Zod serveur (T2 + actions T3).
- **Tests (§6, TDD sur logique)** : helpers de dates (T1) et schéma de validation (T2) en TDD ; test manuel/CLI (T5).
- **Traçabilité (§7)** : ADR 0006 (gestion des dates) (T3), changelog (T7).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `SeanceFormState` défini en T3, consommé en T4/T6 ; `parseSeanceForm`/`seanceSchema` définis en T2, consommés en T3 ; helpers `dates.ts` (T1) consommés en T5 ; `SeanceForm` (T4) réutilisé en T6 avec `updateSeance.bind(null, id)`.
- **Adaptations connues reprises de la phase 3** : `Button` base-ui → `render={<Link/>}` (pas `asChild`) ; Server Action liée via `.bind(null, id)` pour l'édition ; penser à committer le reformatage Prettier des composants shadcn générés.
- **Note création participations** : `createSeance` crée les participations avec `montant = prixReference` et `statutReglement` par défaut (`A_REGLER`). `updateSeance` réconcilie les participants (ajout/retrait) sans toucher aux participations conservées.
