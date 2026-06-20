# Phase 5c — Tableau de bord finances — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offrir au coach une vision de ses finances : **revenus par période** (jour / semaine / mois / année, par date d'encaissement), **filtre par méthode** (espèces / CB / virement), **répartition** privé / collectif / packs, et liste des **impayés** (qui doit encore payer). C'est la dernière brique du projet.

**Architecture:** Page Server Component `/finances` gardée par `requireCoach()`. **Toutes les sommes sont calculées en SQL** via les agrégations Prisma (`aggregate`/`groupBy` → `Decimal` exact) — jamais par addition de flottants JS. Helpers de période purs et testés. En préalable, on **fiabilise le pipeline monétaire** : le prix de séance passe lui aussi par le schéma `montantSchema` (chaîne décimale) jusqu'à Prisma `Decimal`.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Prisma v7 (agrégations), Zod v4, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur : la route `/finances` et toute action exigent une session (`requireCoach()`).
- TypeScript strict partout.
- Pas de migration de schéma (modèles existants depuis la phase 1).
- **Exactitude monétaire** : les sommes de revenus se font en SQL (`prisma.*.aggregate`/`groupBy` `_sum`), qui renvoie un `Decimal` exact. Aucune addition de montants en flottant JS.
- Les **montants saisis** (y compris le prix de séance désormais) transitent en **chaîne décimale** jusqu'à Prisma `Decimal`.
- Revenus par **date d'encaissement** = `Paiement.date`. Répartition : _Privé_/_Collectif_ (paiements liés à une participation, selon `Seance.type`) / _Packs_ (paiements liés à un pack). Impayés = participations `A_REGLER` (état courant, non filtré par période).
- Secrets uniquement dans `.env`. Git : branche `feat/finances-dashboard`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Helpers de période (TDD)

**Files:**

- Create: `lib/finances/periode.ts`, `lib/finances/periode.test.ts`

**Interfaces:**

- Consumes: `startOfDay`/`endOfDay`/`startOfWeek`/`endOfWeek` de `@/lib/planning/dates`.
- Produces (heure locale) :
  - `startOfMonth(d): Date`, `endOfMonth(d): Date`, `startOfYear(d): Date`, `endOfYear(d): Date`
  - `type Periode = "jour" | "semaine" | "mois" | "annee"`
  - `rangePeriode(periode: Periode, ref: Date): { debut: Date; fin: Date }`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/finances/periode.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, rangePeriode } from "./periode";

describe("helpers de période", () => {
  it("startOfMonth = 1er du mois 00:00", () => {
    const r = startOfMonth(new Date(2026, 5, 20, 14, 0));
    expect([r.getDate(), r.getMonth(), r.getHours()]).toEqual([1, 5, 0]);
  });

  it("endOfMonth = dernier jour 23:59 (juin = 30)", () => {
    const r = endOfMonth(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth(), r.getHours(), r.getMinutes()]).toEqual([30, 5, 23, 59]);
  });

  it("endOfMonth gère février (2026 = 28 jours)", () => {
    const r = endOfMonth(new Date(2026, 1, 10));
    expect(r.getDate()).toBe(28);
  });

  it("startOfYear = 1er janvier", () => {
    const r = startOfYear(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth()]).toEqual([1, 0]);
  });

  it("endOfYear = 31 décembre 23:59", () => {
    const r = endOfYear(new Date(2026, 5, 20));
    expect([r.getDate(), r.getMonth(), r.getHours()]).toEqual([31, 11, 23]);
  });

  it("rangePeriode mois renvoie début/fin du mois", () => {
    const { debut, fin } = rangePeriode("mois", new Date(2026, 5, 20));
    expect(debut.getDate()).toBe(1);
    expect(fin.getDate()).toBe(30);
  });

  it("rangePeriode jour renvoie le même jour", () => {
    const { debut, fin } = rangePeriode("jour", new Date(2026, 5, 20, 15));
    expect(debut.getDate()).toBe(20);
    expect(fin.getDate()).toBe(20);
    expect(debut.getHours()).toBe(0);
    expect(fin.getHours()).toBe(23);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/periode.test.ts
```

Expected : ÉCHEC — `Cannot find module './periode'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/finances/periode.ts` :

```typescript
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "@/lib/planning/dates";

export type Periode = "jour" | "semaine" | "mois" | "annee";

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function rangePeriode(periode: Periode, ref: Date): { debut: Date; fin: Date } {
  switch (periode) {
    case "jour":
      return { debut: startOfDay(ref), fin: endOfDay(ref) };
    case "semaine":
      return { debut: startOfWeek(ref), fin: endOfWeek(ref) };
    case "annee":
      return { debut: startOfYear(ref), fin: endOfYear(ref) };
    case "mois":
    default:
      return { debut: startOfMonth(ref), fin: endOfMonth(ref) };
  }
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/finances/periode.test.ts
```

Expected : SUCCÈS — 7 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/finances/periode.ts lib/finances/periode.test.ts
git commit -m "feat: helpers de période finances (TDD)"
```

---

### Task 2 : Fiabiliser le prix de séance (chaîne décimale)

**Files:**

- Modify: `lib/planning/schema.ts` (`prixReference` via `montantSchema`)
- Modify: `lib/planning/schema.test.ts` (prix en chaîne)

**Interfaces:**

- `seanceSchema.prixReference` devient une **chaîne** décimale validée (via `montantSchema`), au lieu de `z.coerce.number()`. `SeanceInput.prixReference` devient `string`. `createSeance`/`updateSeance` (déjà existants) passent alors une chaîne à Prisma `Decimal` — aucune autre modification nécessaire (ils utilisent déjà `prixReference` tel quel pour `prixReference` et `montant`).

- [ ] **Step 1: Mettre à jour le schéma**

Dans `lib/planning/schema.ts` :

1. Ajouter l'import en tête :

```typescript
import { montantSchema } from "@/lib/finances/money";
```

2. Remplacer la ligne `prixReference` :

```typescript
    prixReference: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
```

par :

```typescript
    prixReference: montantSchema,
```

- [ ] **Step 2: Mettre à jour les tests du schéma**

Dans `lib/planning/schema.test.ts` :

1. Dans l'objet `base`, mettre le prix en chaîne :

```typescript
    prixReference: "15",
```

2. Le test « rejette un prix négatif » : remplacer la valeur par une chaîne invalide :

```typescript
it("rejette un prix négatif", () => {
  expect(seanceSchema.safeParse({ ...base, prixReference: "-5" }).success).toBe(false);
});
```

3. Si un test affirme `expect(res.data.prixReference).toBe(15)` (nombre), le passer à `"15"` (chaîne). Vérifier l'ensemble du fichier pour toute autre occurrence numérique de `prixReference`.

- [ ] **Step 3: Vérifier les tests du planning**

Run :

```bash
npm run test:run -- lib/planning/schema.test.ts
```

Expected : SUCCÈS — tous les tests passent (prix en chaîne).

- [ ] **Step 4: Vérifier le build (createSeance/updateSeance compilent avec prix en chaîne)**

Run :

```bash
npm run build
```

Expected : build réussi. (Si une erreur de type apparaît dans `lib/planning/actions.ts` parce que `prixReference`/`montant` étaient typés `number`, c'est attendu : ils acceptent désormais une `string` — Prisma `Decimal` accepte une chaîne. Ajuster un éventuel typage explicite résiduel, sans changer la logique.)

- [ ] **Step 5: Commit**

```bash
git add lib/planning/schema.ts lib/planning/schema.test.ts
git commit -m "refactor: prix de séance en chaîne décimale (pipeline Decimal sans flottant)"
```

---

### Task 3 : Requêtes d'agrégation finances (SQL)

**Files:**

- Create: `lib/finances/dashboard.ts`

**Interfaces:**

- Consumes: `prisma`, `Prisma`/`MethodePaiement` de `@prisma/client`.
- Produces (toutes en SQL via Prisma `aggregate`/`groupBy`) :
  - `getRevenuTotal(debut: Date, fin: Date, methode?: MethodePaiement): Promise<Prisma.Decimal>`
  - `getRepartition(debut, fin): Promise<{ prive: Prisma.Decimal; collectif: Prisma.Decimal; pack: Prisma.Decimal }>`
  - `getImpayes(): Promise<Array<{ eleveId: string; nom: string; total: Prisma.Decimal }>>`

- [ ] **Step 1: Écrire les requêtes**

Créer `lib/finances/dashboard.ts` :

```typescript
import { Prisma, type MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ZERO = new Prisma.Decimal(0);

export async function getRevenuTotal(
  debut: Date,
  fin: Date,
  methode?: MethodePaiement,
): Promise<Prisma.Decimal> {
  const r = await prisma.paiement.aggregate({
    _sum: { montant: true },
    where: { date: { gte: debut, lte: fin }, ...(methode ? { methode } : {}) },
  });
  return r._sum.montant ?? ZERO;
}

export async function getRepartition(
  debut: Date,
  fin: Date,
): Promise<{ prive: Prisma.Decimal; collectif: Prisma.Decimal; pack: Prisma.Decimal }> {
  const periode = { gte: debut, lte: fin };
  const [prive, collectif, pack] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, participation: { seance: { type: "PRIVE" } } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, participation: { seance: { type: "COLLECTIF" } } },
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: periode, packId: { not: null } },
    }),
  ]);
  return {
    prive: prive._sum.montant ?? ZERO,
    collectif: collectif._sum.montant ?? ZERO,
    pack: pack._sum.montant ?? ZERO,
  };
}

export async function getImpayes(): Promise<
  Array<{ eleveId: string; nom: string; total: Prisma.Decimal }>
> {
  const groupes = await prisma.participation.groupBy({
    by: ["eleveId"],
    where: { statutReglement: "A_REGLER" },
    _sum: { montant: true },
  });
  const eleveIds = groupes.map((g) => g.eleveId);
  const eleves = await prisma.eleve.findMany({
    where: { id: { in: eleveIds } },
    select: { id: true, prenom: true, nom: true },
  });
  const nomParId = new Map(eleves.map((e) => [e.id, `${e.prenom} ${e.nom}`]));

  return groupes
    .map((g) => ({
      eleveId: g.eleveId,
      nom: nomParId.get(g.eleveId) ?? "—",
      total: g._sum.montant ?? ZERO,
    }))
    .filter((x) => x.total.greaterThan(0))
    .sort((a, b) => b.total.comparedTo(a.total));
}
```

- [ ] **Step 2: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi. (Si Prisma v7 refuse un filtre de relation imbriqué dans `aggregate` — `participation: { seance: { type } }` — le diagnostiquer et, en repli, calculer la répartition en récupérant les paiements de la période avec `include: { participation: { include: { seance: true } } }` puis en sommant avec `Prisma.Decimal.add` (arithmétique Decimal, jamais de flottant). Documenter l'approche retenue.)

- [ ] **Step 3: Commit**

```bash
git add lib/finances/dashboard.ts
git commit -m "feat: requêtes d'agrégation finances (revenus, répartition, impayés) en SQL"
```

---

### Task 4 : Page tableau de bord `/finances`

**Files:**

- Create: `app/finances/page.tsx`, `app/finances/filtres.tsx`

**Interfaces:**

- Consumes: `requireCoach`, `rangePeriode`/`Periode`, `getRevenuTotal`/`getRepartition`/`getImpayes`, `formatEuros`.
- Produces: page `/finances` (param `?periode=&date=&methode=`) : sélecteur de période, filtre méthode, total encaissé, répartition, impayés.

- [ ] **Step 1: Créer les filtres (composant client)**

Créer `app/finances/filtres.tsx` :

```tsx
"use client";

import { useRouter } from "next/navigation";
import type { Periode } from "@/lib/finances/periode";

const PERIODES: Array<[Periode, string]> = [
  ["jour", "Jour"],
  ["semaine", "Semaine"],
  ["mois", "Mois"],
  ["annee", "Année"],
];

const METHODES: Array<[string, string]> = [
  ["", "Toutes méthodes"],
  ["ESPECES", "Espèces"],
  ["CB", "CB"],
  ["VIREMENT", "Virement"],
];

export function FiltresFinances({
  periode,
  date,
  methode,
}: {
  periode: Periode;
  date: string;
  methode: string;
}) {
  const router = useRouter();
  const naviguer = (next: { periode?: Periode; date?: string; methode?: string }) => {
    const params = new URLSearchParams({
      periode: next.periode ?? periode,
      date: next.date ?? date,
      methode: next.methode ?? methode,
    });
    router.push(`/finances?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PERIODES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => naviguer({ periode: value })}
            className={`rounded-md border px-3 py-1 text-sm ${periode === value ? "bg-foreground text-background" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => naviguer({ date: e.target.value })}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        />
        <select
          value={methode}
          onChange={(e) => naviguer({ methode: e.target.value })}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          {METHODES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Créer la page finances**

Créer `app/finances/page.tsx` :

```tsx
import Link from "next/link";
import type { MethodePaiement } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { rangePeriode, type Periode } from "@/lib/finances/periode";
import { getRevenuTotal, getRepartition, getImpayes } from "@/lib/finances/dashboard";
import { formatEuros } from "@/lib/finances/format";
import { parseDateParam, toDateParam } from "@/lib/planning/format";
import { FiltresFinances } from "./filtres";

const METHODES_VALIDES = ["ESPECES", "CB", "VIREMENT"] as const;

function parsePeriode(v?: string): Periode {
  return v === "jour" || v === "semaine" || v === "annee" ? v : "mois";
}

export default async function FinancesPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; date?: string; methode?: string }>;
}) {
  await requireCoach();
  const sp = await searchParams;
  const periode = parsePeriode(sp.periode);
  const ref = parseDateParam(sp.date);
  const methode = (METHODES_VALIDES as readonly string[]).includes(sp.methode ?? "")
    ? (sp.methode as MethodePaiement)
    : undefined;

  const { debut, fin } = rangePeriode(periode, ref);
  const [total, repartition, impayes] = await Promise.all([
    getRevenuTotal(debut, fin, methode),
    getRepartition(debut, fin),
    getImpayes(),
  ]);

  const totalImpayes = impayes.reduce((acc, i) => acc.add(i.total), repartition.prive.mul(0));

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <Link href="/" className="text-muted-foreground text-sm">
        ← Tableau de bord
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">Finances</h1>

      <div className="mb-4">
        <FiltresFinances periode={periode} date={toDateParam(ref)} methode={sp.methode ?? ""} />
      </div>

      <section className="mb-6 rounded-md border p-4">
        <p className="text-muted-foreground text-sm">Encaissé sur la période</p>
        <p className="text-3xl font-semibold">{formatEuros(total.toString())}</p>
        {methode ? <p className="text-muted-foreground text-sm">Filtré : {sp.methode}</p> : null}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Répartition (toutes méthodes)</h2>
        <ul className="divide-y rounded-md border">
          <Ligne label="Cours privés" value={repartition.prive.toString()} />
          <Ligne label="Cours collectifs" value={repartition.collectif.toString()} />
          <Ligne label="Packs" value={repartition.pack.toString()} />
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">
          Impayés ({formatEuros(totalImpayes.toString())})
        </h2>
        {impayes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun impayé. 🎉</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {impayes.map((i) => (
              <li key={i.eleveId} className="flex items-center justify-between p-3 text-sm">
                <Link href={`/eleves/${i.eleveId}`} className="font-medium hover:underline">
                  {i.nom}
                </Link>
                <span className="text-muted-foreground">{formatEuros(i.total.toString())}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Ligne({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between p-3 text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground">{formatEuros(value)}</span>
    </li>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi ; route `/finances` présente.

- [ ] **Step 4: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /finances` → 307 vers `/login`. Arrêter le serveur. Noter dans le rapport.

- [ ] **Step 5: Commit**

```bash
git add app/finances/page.tsx app/finances/filtres.tsx
git commit -m "feat: page tableau de bord finances (revenus, répartition, impayés)"
```

---

### Task 5 : Lien tableau de bord + ADR + vérification finale + changelog

**Files:**

- Modify: `app/page.tsx` (lien vers `/finances`)
- Create (ADR): `docs/historique/adr/0009-aggregations-finances-sql.md`
- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Ajouter un lien « Finances » au tableau de bord**

Dans `app/page.tsx`, ajouter (à côté des liens Élèves/Planning, avant la déconnexion) :

```tsx
<Button render={<Link href="/finances" />}>Finances</Button>
```

(Conserver le reste ; `Link` est déjà importé. `Button` base-ui → `render`.)

- [ ] **Step 2: Écrire l'ADR**

Créer `docs/historique/adr/0009-aggregations-finances-sql.md` :

```markdown
# ADR 0009 — Agrégations financières en SQL (Decimal exact)

**Date :** 2026-06-20
**Statut :** Accepté

## Contexte

Le tableau de bord additionne des montants (`Paiement.montant`, `Participation.montant`).
Additionner des montants en flottant JS (`Number`) introduit des artefacts (0.1 + 0.2…).

## Décision

Toutes les sommes de revenus et d'impayés sont calculées **en SQL** via les agrégations
Prisma (`aggregate`/`groupBy` avec `_sum`), qui renvoient un `Decimal` exact. Les montants
saisis (prix de séance, prix de pack) transitent en **chaîne décimale** jusqu'à Prisma
`Decimal`. Le formatage à l'affichage (`formatEuros`) est la seule conversion en nombre,
et n'est jamais réutilisé pour un calcul.

## Alternatives écartées

- Récupérer les lignes et sommer en JS avec `Number` : risque d'imprécision sur les totaux.
- Sommer en JS avec une lib Decimal : possible, mais l'agrégation SQL est plus simple et
  plus performante.

## Conséquences

- Les chiffres financiers sont exacts au centime.
- La répartition s'appuie sur des filtres de relation Prisma (`participation.seance.type`,
  `packId`) — trois agrégations.
```

- [ ] **Step 3: Lint**

Run :

```bash
npm run lint
```

Expected : aucune erreur (corriger toute apostrophe non échappée des nouveaux fichiers).

- [ ] **Step 4: Tests**

Run :

```bash
npm run test:run
```

Expected : tous les tests passent (auth + élèves + planning + finances/format + money + pack-schema + periode + smoke).

- [ ] **Step 5: Build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 6: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Phase 5c : Tableau de bord finances

- Page Finances : revenus par période (jour/semaine/mois/année) par date d'encaissement, filtre par méthode.
- Répartition privé / collectif / packs ; liste des impayés par élève.
- Sommes calculées en SQL (Decimal exact) ; prix de séance fiabilisé en chaîne décimale — ADR 0009.
```

- [ ] **Step 7: Formater et committer**

```bash
npm run format
git add app/page.tsx docs/historique/adr/0009-aggregations-finances-sql.md docs/historique/CHANGELOG.md
git commit -m "docs: ADR 0009 + lien finances + changelog phase 5c"
```

La phase 5c — et le projet — sont terminés : gestion complète des rendez-vous, élèves et
finances. Fusion de `feat/finances-dashboard` vers `main` via PR après tests.

---

## Self-Review

- **Couverture de la spec (§4.4 Finances)** : revenus par période jour/semaine/mois/année (T1 + T3 + T4), filtre par méthode (T3 + T4), répartition privé/collectif (+ packs) (T3 + T4), impayés (T3 + T4).
- **Exactitude monétaire (note revues 4/5b)** : sommes en SQL `_sum` → `Decimal` (T3) ; prix de séance fiabilisé en chaîne (T2) ; `formatEuros` réservé à l'affichage.
- **Sécurité (§5)** : `requireCoach()` sur la page (T4).
- **Tests (§6)** : helpers de période en TDD (T1) ; schéma séance ajusté et re-testé (T2) ; test manuel e2e (T4). _(Dette connue, non bloquante : tests d'intégration des requêtes/agrégations — nécessitent une base de test.)_
- **Traçabilité (§7)** : ADR 0009 (T5), changelog (T5).
- **Placeholders** : aucun — code complet à chaque étape ; repli documenté si un filtre de relation Prisma en `aggregate` posait souci (T3 Step 2).
- **Cohérence des types** : `rangePeriode`/`Periode` (T1) consommés par la page (T4) ; `getRevenuTotal`/`getRepartition`/`getImpayes` (T3) consommés par la page (T4) ; `montantSchema` (5b) réutilisé pour le prix de séance (T2) ; `formatEuros`/`parseDateParam`/`toDateParam` réutilisés.
- **Adaptations connues** : `Button` base-ui → `render` ; pages dynamiques (auth) → données fraîches ; reformatage Prettier des composants.
