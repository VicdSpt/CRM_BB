# Design 6 — Restyle Finances — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embellir le tableau de bord Finances : **total encaissé bien en avant**, **barres de proportion** pour la répartition (privé / collectif / packs), impayés avec pastilles, et filtres en « segmented control » corail — sans changer la logique ni les calculs.

**Architecture:** Un helper pur `pourcentage` (testé, display-only) et un composant `BarreRepartition`. La page `/finances` et `filtres.tsx` sont restylées. Les sommes restent calculées en SQL/Decimal (inchangées) ; `Number()` n'est utilisé que pour la **largeur visuelle** des barres (jamais pour de l'argent).

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Périmètre **présentation** : aucune requête, agrégation ou logique modifiée ; les totaux viennent toujours de `getRevenuTotal`/`getRepartition`/`getImpayes` (SQL/Decimal).
- `Number()` autorisé **uniquement** pour calculer un pourcentage d'affichage (largeur de barre) ; jamais pour additionner de l'argent.
- Accent corail via les jetons ; filtre de période actif en corail (`bg-primary text-primary-foreground`).
- Build vert, lint propre, tests existants au vert + un test pour `pourcentage` (TDD).
- Git : branche `feat/design-finances` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Helper `pourcentage` (TDD) + composant `BarreRepartition`

**Files:**

- Create: `lib/finances/pourcentage.ts`, `lib/finances/pourcentage.test.ts`
- Create: `components/barre-repartition.tsx`

**Interfaces:**

- Produces:
  - `pourcentage(part: number, total: number): number` — `part/total` en % entier, borné 0–100 ; `0` si `total <= 0`.
  - `BarreRepartition` — libellé + montant formaté + barre de proportion.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/finances/pourcentage.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { pourcentage } from "./pourcentage";

describe("pourcentage", () => {
  it("renvoie 0 si le total est nul", () => {
    expect(pourcentage(0, 0)).toBe(0);
    expect(pourcentage(10, 0)).toBe(0);
  });

  it("calcule un pourcentage entier", () => {
    expect(pourcentage(50, 100)).toBe(50);
    expect(pourcentage(1, 3)).toBe(33);
  });

  it("borne à 100", () => {
    expect(pourcentage(150, 100)).toBe(100);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/pourcentage.test.ts
```

Expected : ÉCHEC — `Cannot find module './pourcentage'`.

- [ ] **Step 3: Écrire le helper**

Créer `lib/finances/pourcentage.ts` :

```typescript
export function pourcentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/finances/pourcentage.test.ts
```

Expected : SUCCÈS — 3 tests passés.

- [ ] **Step 5: Créer le composant BarreRepartition**

Créer `components/barre-repartition.tsx` :

```tsx
import { formatEuros } from "@/lib/finances/format";
import { pourcentage } from "@/lib/finances/pourcentage";

export function BarreRepartition({
  label,
  montant,
  total,
}: {
  label: string;
  montant: string;
  total: string;
}) {
  const pct = pourcentage(Number(montant), Number(total));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">{formatEuros(montant)}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
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
git add lib/finances/pourcentage.ts lib/finances/pourcentage.test.ts components/barre-repartition.tsx
git commit -m "feat(design): helper pourcentage (TDD) + composant BarreRepartition"
```

---

### Task 2 : Restyle de la page `/finances` + filtres

**Files:**

- Modify: `app/finances/page.tsx`
- Modify: `app/finances/filtres.tsx`

**Interfaces:**

- Consumes: `BarreRepartition`, `Initiales` (`@/components/initiales`).

- [ ] **Step 1: Restyler le total, la répartition et les impayés**

Dans `app/finances/page.tsx` :

1. Ajouter les imports :

```tsx
import { BarreRepartition } from "@/components/barre-repartition";
import { Initiales } from "@/components/initiales";
```

2. Calculer le total de répartition (pour les barres) juste après `totalImpayes` :

```tsx
const totalRepartition = repartition.prive
  .add(repartition.collectif)
  .add(repartition.pack)
  .toString();
```

3. Remplacer la **carte total** par une version plus marquée :

```tsx
<section className="border-primary/30 from-primary/10 mb-6 rounded-xl border bg-gradient-to-br to-transparent p-5">
  <p className="text-muted-foreground text-sm">Encaissé sur la période</p>
  <p className="text-4xl font-bold tracking-tight tabular-nums">{formatEuros(total.toString())}</p>
  {methode ? <p className="text-muted-foreground mt-1 text-sm">Filtré : {sp.methode}</p> : null}
</section>
```

4. Remplacer la **section Répartition** (le `<ul>` et ses `<Ligne>`) par des barres :

```tsx
<section className="mb-6">
  <h2 className="mb-3 text-sm font-semibold">Répartition (toutes méthodes)</h2>
  <div className="flex flex-col gap-4 rounded-lg border p-4">
    <BarreRepartition
      label="Cours privés"
      montant={repartition.prive.toString()}
      total={totalRepartition}
    />
    <BarreRepartition
      label="Cours collectifs"
      montant={repartition.collectif.toString()}
      total={totalRepartition}
    />
    <BarreRepartition
      label="Packs"
      montant={repartition.pack.toString()}
      total={totalRepartition}
    />
  </div>
</section>
```

5. Remplacer la **liste des impayés** par des lignes avec pastille :

```tsx
<ul className="flex flex-col gap-2">
  {impayes.map((i) => (
    <li key={i.eleveId}>
      <Link
        href={`/eleves/${i.eleveId}`}
        className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3 text-sm"
      >
        <Initiales prenom={i.nom} nom="" />
        <span className="font-medium">{i.nom}</span>
        <span className="text-muted-foreground ml-auto tabular-nums">
          {formatEuros(i.total.toString())}
        </span>
      </Link>
    </li>
  ))}
</ul>
```

6. Supprimer la fonction `Ligne` en bas du fichier (remplacée par `BarreRepartition`).

(Conserver toute la logique de chargement : `requireCoach`, `rangePeriode`, `Promise.all`, `totalImpayes`, `parsePeriode`, etc.)

- [ ] **Step 2: Filtre de période actif en corail**

Dans `app/finances/filtres.tsx`, remplacer la classe du bouton de période par :

```tsx
            className={`rounded-md border px-3 py-1 text-sm ${
              periode === value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
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

Vérifier (non authentifié) : `GET /finances` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — grand total, barres, pastilles — sera fait par l'utilisateur.)

- [ ] **Step 5: Commit**

```bash
git add app/finances/page.tsx app/finances/filtres.tsx
git commit -m "feat(design): finances restylées (total en avant, barres de répartition, impayés)"
```

---

### Task 3 : Vérification finale + changelog (fin de la refonte)

**Files:**

- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Lint, tests, build**

Run :

```bash
npm run lint && npm run test:run && npm run build
```

Expected : lint propre, tous les tests passent (dont `pourcentage`), build réussi.

- [ ] **Step 2: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Design 6 : Restyle Finances (fin de la refonte)

- Total encaissé mis en avant ; répartition (privé / collectif / packs) en barres de proportion.
- Impayés avec pastilles ; filtres de période en corail. La refonte du design est terminée.
```

- [ ] **Step 3: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog design 6 (finances) — fin de la refonte"
```

(Inclure d'éventuels fichiers reformatés.)

La sous-phase 6 — et toute la refonte du design — sont terminées. Fusion de
`feat/design-finances` vers `main` via PR après tests.

---

## Self-Review

- **Couverture spec §5 (Finances)** : total encaissé en grand (T2), répartition avec barres de proportion (T1 + T2), impayés en liste nette avec pastilles (T2), filtres période en corail (T2).
- **Périmètre présentation** : aucune requête/agrégation touchée ; `Number()` seulement pour la largeur des barres (display) ; les montants restent affichés via `formatEuros` (Decimal → string).
- **Tests** : `pourcentage` en TDD (T1) ; suite existante conservée verte (T3) ; test manuel e2e (T2).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `pourcentage` (T1) consommé par `BarreRepartition` (T1) ; `BarreRepartition`/`Initiales` consommés par la page (T2) ; suppression de la fonction locale `Ligne`.
- **Note pastille impayés** : `Initiales` reçoit `prenom={i.nom}` (le nom complet) et `nom=""` — la pastille affiche l'initiale du nom complet, ce qui est suffisant ici (la liste impayés n'a que `nom` = « Prénom Nom »).
