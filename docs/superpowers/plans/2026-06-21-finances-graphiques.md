# Graphiques Finances (camembert + courbe) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à `/finances` un **camembert** de répartition (privé/collectif/packs) et une **courbe d'évolution** du revenu total, pilotés par le sélecteur de période existant.

**Architecture:** Logique de découpage temporel pure et testée (`lib/finances/evolution.ts`) ; une fonction serveur `getEvolution` qui agrège les paiements par intervalle en **Decimal** (exact) ; deux composants client **Recharts** (via le module charts de shadcn) thématisés. Aucune logique métier, écriture ou validation modifiée.

**Tech Stack:** Next.js 16, TypeScript strict, Prisma v7, **Recharts** (via `shadcn add chart`), Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Périmètre **présentation + une agrégation en lecture** : aucune écriture/Server Action/validation modifiée.
- **Exactitude monétaire** : les sommes par intervalle se font en `Prisma.Decimal` ; `Number()` n'est utilisé que pour **tracer** (taille des parts / hauteur de courbe), jamais pour additionner de l'argent.
- Granularité dérivée du sélecteur : `jour`→heure, `semaine`→jour, `mois`→jour, `annee`→mois.
- Camembert et courbe restent **« toutes méthodes »** (cohérent avec la répartition existante).
- Build vert, lint propre, suite existante au vert + tests TDD des helpers de découpage.
- Git : branche `feat/finances-graphiques` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell. `Button` = base-ui (`render`).

---

### Task 1 : Helpers de découpage temporel (TDD)

**Files:**

- Create: `lib/finances/evolution.ts`, `lib/finances/evolution.test.ts`

**Interfaces:**

- Consumes: `startOfDay`/`endOfDay`/`addDays` (`@/lib/planning/dates`), `startOfMonth`/`endOfMonth` (`@/lib/finances/periode`), `Prisma` (`@prisma/client`).
- Produces:
  - `type Granularite = "heure" | "jour" | "mois"`
  - `type Bucket = { debut: Date; fin: Date; label: string }`
  - `granulariteParPeriode(periode: "jour" | "semaine" | "mois" | "annee"): Granularite`
  - `genererBuckets(debut: Date, fin: Date, granularite: Granularite): Bucket[]`
  - `agregerParBucket(paiements: { date: Date; montant: Prisma.Decimal }[], buckets: Bucket[]): { label: string; total: Prisma.Decimal }[]`

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/finances/evolution.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { granulariteParPeriode, genererBuckets, agregerParBucket } from "./evolution";

describe("granulariteParPeriode", () => {
  it("mappe période → granularité", () => {
    expect(granulariteParPeriode("jour")).toBe("heure");
    expect(granulariteParPeriode("semaine")).toBe("jour");
    expect(granulariteParPeriode("mois")).toBe("jour");
    expect(granulariteParPeriode("annee")).toBe("mois");
  });
});

describe("genererBuckets", () => {
  it("génère 24 intervalles horaires sur une journée", () => {
    const debut = new Date(2026, 5, 20, 0, 0, 0, 0);
    const fin = new Date(2026, 5, 20, 23, 59, 59, 999);
    const b = genererBuckets(debut, fin, "heure");
    expect(b).toHaveLength(24);
    expect(b[0].label).toBe("0h");
    expect(b[14].label).toBe("14h");
  });

  it("génère un intervalle par jour sur une semaine", () => {
    const debut = new Date(2026, 5, 15, 0, 0, 0, 0); // lundi
    const fin = new Date(2026, 5, 21, 23, 59, 59, 999); // dimanche
    const b = genererBuckets(debut, fin, "jour");
    expect(b).toHaveLength(7);
    expect(b[0].label).toBe("15");
    expect(b[6].label).toBe("21");
  });

  it("génère un intervalle par mois sur une année", () => {
    const debut = new Date(2026, 0, 1, 0, 0, 0, 0);
    const fin = new Date(2026, 11, 31, 23, 59, 59, 999);
    const b = genererBuckets(debut, fin, "mois");
    expect(b).toHaveLength(12);
  });
});

describe("agregerParBucket", () => {
  it("somme les montants dans le bon intervalle (Decimal exact)", () => {
    const debut = new Date(2026, 5, 15, 0, 0, 0, 0);
    const fin = new Date(2026, 5, 17, 23, 59, 59, 999);
    const buckets = genererBuckets(debut, fin, "jour"); // 15, 16, 17
    const paiements = [
      { date: new Date(2026, 5, 15, 10, 0), montant: new Prisma.Decimal("15.50") },
      { date: new Date(2026, 5, 15, 18, 0), montant: new Prisma.Decimal("4.50") },
      { date: new Date(2026, 5, 17, 9, 0), montant: new Prisma.Decimal("30") },
    ];
    const r = agregerParBucket(paiements, buckets);
    expect(r[0].total.toString()).toBe("20"); // 15.50 + 4.50
    expect(r[1].total.toString()).toBe("0"); // 16 juin
    expect(r[2].total.toString()).toBe("30");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/evolution.test.ts
```

Expected : ÉCHEC — `Cannot find module './evolution'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/finances/evolution.ts` :

```typescript
import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, addDays } from "@/lib/planning/dates";
import { startOfMonth, endOfMonth } from "@/lib/finances/periode";

export type Granularite = "heure" | "jour" | "mois";
export type Bucket = { debut: Date; fin: Date; label: string };

export function granulariteParPeriode(periode: "jour" | "semaine" | "mois" | "annee"): Granularite {
  if (periode === "jour") return "heure";
  if (periode === "annee") return "mois";
  return "jour";
}

export function genererBuckets(debut: Date, fin: Date, granularite: Granularite): Bucket[] {
  const buckets: Bucket[] = [];

  if (granularite === "heure") {
    const start = new Date(
      debut.getFullYear(),
      debut.getMonth(),
      debut.getDate(),
      debut.getHours(),
      0,
      0,
      0,
    );
    for (let t = start; t <= fin; t = new Date(t.getTime() + 3_600_000)) {
      buckets.push({
        debut: new Date(t),
        fin: new Date(t.getTime() + 3_600_000 - 1),
        label: `${t.getHours()}h`,
      });
    }
    return buckets;
  }

  if (granularite === "jour") {
    for (let d = startOfDay(debut); d <= fin; d = addDays(d, 1)) {
      buckets.push({ debut: d, fin: endOfDay(d), label: `${d.getDate()}` });
    }
    return buckets;
  }

  // mois
  const formatMois = new Intl.DateTimeFormat("fr-FR", { month: "short" });
  for (let m = startOfMonth(debut); m <= fin; m = startOfMonth(addDays(endOfMonth(m), 1))) {
    buckets.push({ debut: m, fin: endOfMonth(m), label: formatMois.format(m) });
  }
  return buckets;
}

export function agregerParBucket(
  paiements: { date: Date; montant: Prisma.Decimal }[],
  buckets: Bucket[],
): { label: string; total: Prisma.Decimal }[] {
  return buckets.map((b) => {
    const total = paiements
      .filter((p) => p.date >= b.debut && p.date <= b.fin)
      .reduce((acc, p) => acc.add(p.montant), new Prisma.Decimal(0));
    return { label: b.label, total };
  });
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/finances/evolution.test.ts
```

Expected : SUCCÈS — 5 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/finances/evolution.ts lib/finances/evolution.test.ts
git commit -m "feat(finances): helpers de découpage temporel pour l'évolution (TDD)"
```

---

### Task 2 : `getEvolution` + installation du module charts (recharts)

**Files:**

- Modify: `lib/finances/dashboard.ts` (ajout `getEvolution`)
- Create (via CLI): `components/ui/chart.tsx` (+ dépendance `recharts`)

**Interfaces:**

- Consumes: `prisma`, `genererBuckets`/`agregerParBucket`/`Granularite` (`@/lib/finances/evolution`).
- Produces: `getEvolution(debut: Date, fin: Date, granularite: Granularite): Promise<{ label: string; total: number }[]>` — somme Decimal par intervalle, convertie en nombre pour le tracé.

- [ ] **Step 1: Installer le module charts de shadcn (ajoute recharts)**

Run :

```bash
npx shadcn@latest add chart --yes
```

Expected : `components/ui/chart.tsx` créé et `recharts` ajouté à `package.json`. (Si la CLI demande, accepter les défauts.)

- [ ] **Step 2: Ajouter `getEvolution` dans `lib/finances/dashboard.ts`**

Ajouter l'import en tête (après les imports existants) :

```typescript
import { genererBuckets, agregerParBucket, type Granularite } from "@/lib/finances/evolution";
```

Puis ajouter à la fin du fichier :

```typescript
export async function getEvolution(
  debut: Date,
  fin: Date,
  granularite: Granularite,
): Promise<{ label: string; total: number }[]> {
  const paiements = await prisma.paiement.findMany({
    where: { date: { gte: debut, lte: fin } },
    select: { date: true, montant: true },
  });
  const buckets = genererBuckets(debut, fin, granularite);
  return agregerParBucket(paiements, buckets).map((b) => ({
    label: b.label,
    total: Number(b.total),
  }));
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi (recharts installé, `getEvolution` compile ; pas encore utilisé par une page — attendu).

- [ ] **Step 4: Commit**

```bash
git add lib/finances/dashboard.ts components/ui/chart.tsx package.json package-lock.json
git commit -m "feat(finances): getEvolution (agrégation par intervalle) + module charts shadcn"
```

---

### Task 3 : Composants graphiques (camembert + courbe)

**Files:**

- Create: `components/finances/camembert-repartition.tsx`, `components/finances/courbe-evolution.tsx`

**Interfaces:**

- Consumes: `recharts`, le wrapper `@/components/ui/chart` (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, type `ChartConfig`), `formatEuros`.
- Produces:
  - `CamembertRepartition({ prive, collectif, pack }: { prive: string; collectif: string; pack: string })`
  - `CourbeEvolution({ data }: { data: { label: string; total: number }[] })`

> Note : suivre l'API réellement générée dans `components/ui/chart.tsx` par shadcn. Les exports usuels sont `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig`. Si un nom diffère, adapter en conséquence (le build le signalera).

- [ ] **Step 1: Créer le camembert**

Créer `components/finances/camembert-repartition.tsx` :

```tsx
"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatEuros } from "@/lib/finances/format";

const config = {
  montant: { label: "Montant" },
  prive: { label: "Cours privés", color: "var(--primary)" },
  collectif: { label: "Cours collectifs", color: "var(--color-sky-500)" },
  pack: { label: "Packs", color: "var(--color-amber-500)" },
} satisfies ChartConfig;

export function CamembertRepartition({
  prive,
  collectif,
  pack,
}: {
  prive: string;
  collectif: string;
  pack: string;
}) {
  const data = [
    { cle: "prive", montant: Number(prive), fill: "var(--color-prive)" },
    { cle: "collectif", montant: Number(collectif), fill: "var(--color-collectif)" },
    { cle: "pack", montant: Number(pack), fill: "var(--color-pack)" },
  ];
  const total = data.reduce((acc, d) => acc + d.montant, 0);

  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Rien à répartir.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={config} className="aspect-square h-[180px]">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="cle" hideLabel />} />
          <Pie data={data} dataKey="montant" nameKey="cle" innerRadius={45} />
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.cle} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: d.fill }} />
            <span>{config[d.cle as "prive" | "collectif" | "pack"].label}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatEuros(d.montant.toString())}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Créer la courbe**

Créer `components/finances/courbe-evolution.tsx` :

```tsx
"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  total: { label: "Revenu", color: "var(--primary)" },
} satisfies ChartConfig;

export function CourbeEvolution({ data }: { data: { label: string; total: number }[] }) {
  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Aucun encaissement sur cette période.</p>;
  }

  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi. (Si un export de `@/components/ui/chart` diffère, ajuster l'import selon le fichier généré.)

- [ ] **Step 4: Commit**

```bash
git add components/finances/camembert-repartition.tsx components/finances/courbe-evolution.tsx
git commit -m "feat(finances): composants camembert et courbe d'évolution"
```

---

### Task 4 : Intégration dans la page `/finances` + vérification finale

**Files:**

- Modify: `app/finances/page.tsx`
- Modify: `docs/historique/CHANGELOG.md`

**Interfaces:**

- Consumes: `getEvolution`, `granulariteParPeriode`, `CamembertRepartition`, `CourbeEvolution`.

- [ ] **Step 1: Brancher l'évolution et les graphes dans la page**

Dans `app/finances/page.tsx` :

1. Ajouter les imports :

```tsx
import { getEvolution } from "@/lib/finances/dashboard";
import { granulariteParPeriode } from "@/lib/finances/evolution";
import { CamembertRepartition } from "@/components/finances/camembert-repartition";
import { CourbeEvolution } from "@/components/finances/courbe-evolution";
```

2. Calculer l'évolution en parallèle. Remplacer le `Promise.all` existant par :

```tsx
const [total, repartition, impayes, evolution] = await Promise.all([
  getRevenuTotal(debut, fin, methode),
  getRepartition(debut, fin),
  getImpayes(),
  getEvolution(debut, fin, granulariteParPeriode(periode)),
]);
```

3. Insérer une **section Évolution** juste APRÈS la carte « Total encaissé » (avant la Répartition) :

```tsx
<section className="mb-6">
  <h2 className="mb-3 text-sm font-semibold">Évolution du revenu</h2>
  <div className="rounded-lg border p-4">
    <CourbeEvolution data={evolution} />
  </div>
</section>
```

4. Remplacer le **contenu de la section Répartition** (le `<div className="flex flex-col gap-4 rounded-lg border p-4">…</div>` qui contient les 3 `<BarreRepartition>`) par le camembert :

```tsx
<div className="rounded-lg border p-4">
  <CamembertRepartition
    prive={repartition.prive.toString()}
    collectif={repartition.collectif.toString()}
    pack={repartition.pack.toString()}
  />
</div>
```

5. Retirer l'import devenu inutile `import { BarreRepartition } from "@/components/barre-repartition";` (le composant `BarreRepartition` reste dans le dépôt mais n'est plus utilisé ici). Conserver tout le reste (filtres, total, impayés, logique de chargement).

- [ ] **Step 2: Lint, build**

Run :

```bash
npm run lint && npm run build
```

Expected : lint propre (pas d'import inutilisé), build réussi, route `/finances` présente.

- [ ] **Step 3: Tests**

Run :

```bash
npm run test:run
```

Expected : tous les tests passent (dont les helpers d'évolution).

- [ ] **Step 4: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /finances` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — camembert + courbe selon la période — sera fait par l'utilisateur.)

- [ ] **Step 5: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-21 — Finances : graphiques

- Répartition affichée en camembert (privé / collectif / packs).
- Courbe d'évolution du revenu sur la période (granularité selon le sélecteur) ; agrégation Decimal exacte.
```

- [ ] **Step 6: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add app/finances/page.tsx docs/historique/CHANGELOG.md
git commit -m "feat(finances): camembert de répartition + courbe d'évolution dans la page"
```

La fonctionnalité est terminée. Fusion de `feat/finances-graphiques` vers `main` via PR après tests.

---

## Self-Review

- **Couverture spec §2 (lib)** : `shadcn add chart` + recharts (T2). **§3 (données)** : camembert sur `getRepartition` (T3+T4), `getEvolution` + granularité + buckets + agrégation Decimal (T1+T2). **§4 (UI)** : courbe insérée avant la répartition, camembert + légende, états vides (T3+T4). **§5 (tests)** : helpers en TDD (T1).
- **Exactitude monétaire** : sommes par intervalle en `Prisma.Decimal` (T1) ; `Number()` seulement pour le tracé (T2 conversion finale, T3 tailles). Légendes via `formatEuros`.
- **Placeholders** : aucun — code complet ; seule réserve explicite = adapter aux noms réellement exportés par le `chart.tsx` généré (noté en T3).
- **Cohérence des types** : `Granularite`/`genererBuckets`/`agregerParBucket` (T1) consommés par `getEvolution` (T2) ; `getEvolution`/`granulariteParPeriode` consommés par la page (T4) ; `CamembertRepartition`/`CourbeEvolution` (T3) consommés par la page (T4).
- **Périmètre** : aucune écriture/validation touchée ; `BarreRepartition` laissé dans le dépôt (plus utilisé sur cette page) — pas de suppression hasardeuse.
- **Risque connu** : l'API exacte du module charts shadcn peut varier ; le build (T3) sert de garde-fou et l'implémenteur adapte les imports si besoin.
