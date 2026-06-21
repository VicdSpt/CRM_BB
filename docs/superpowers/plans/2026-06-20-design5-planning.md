# Design 5 — Restyle Planning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embellir le Planning : séances en **cartes codées couleur par type** (privé / collectif), **badges de statut** colorés (planifiée / réalisée / annulée), et fiche séance plus lisible — sans changer la logique.

**Architecture:** Des libellés centralisés (`lib/planning/libelles.ts`, testés) et un composant présentationnel `BadgeStatut`. Les pages `/planning` et `/planning/[id]` sont restylées (classes Tailwind + composants). Aucune requête, Server Action ou validation modifiée.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Vitest, Tailwind + shadcn/ui, lucide-react.

## Global Constraints

- Périmètre **présentation** : aucune logique métier, requête, Server Action ou validation modifiée.
- Code couleur **type** : privé = accent corail (`border-l-primary`), collectif = bleu (`border-l-sky-500`) ; toujours doublé du texte « Privé »/« Collectif ».
- **Statut** = couleur **+ texte** : planifiée = ambre, réalisée = vert, annulée = rouge (jamais la couleur seule).
- Composant `BadgeStatut` présentationnel (utilisable dans des Server Components).
- Build vert, lint propre, tests existants au vert + un test pour les libellés (TDD).
- Git : branche `feat/design-planning` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell. `Button` = base-ui (`render`, pas `asChild`).

---

### Task 1 : Libellés (TDD) + composant `BadgeStatut`

**Files:**

- Create: `lib/planning/libelles.ts`, `lib/planning/libelles.test.ts`
- Create: `components/badge-statut.tsx`

**Interfaces:**

- Produces:
  - `libelleStatut(statut: "PLANIFIEE" | "REALISEE" | "ANNULEE"): string`
  - `libelleType(type: "PRIVE" | "COLLECTIF"): string`
  - `BadgeStatut` — pastille colorée + texte selon le statut.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/planning/libelles.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { libelleStatut, libelleType } from "./libelles";

describe("libelleStatut", () => {
  it("traduit les statuts", () => {
    expect(libelleStatut("PLANIFIEE")).toBe("Planifiée");
    expect(libelleStatut("REALISEE")).toBe("Réalisée");
    expect(libelleStatut("ANNULEE")).toBe("Annulée");
  });
});

describe("libelleType", () => {
  it("traduit les types", () => {
    expect(libelleType("PRIVE")).toBe("Privé");
    expect(libelleType("COLLECTIF")).toBe("Collectif");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/planning/libelles.test.ts
```

Expected : ÉCHEC — `Cannot find module './libelles'`.

- [ ] **Step 3: Écrire les libellés**

Créer `lib/planning/libelles.ts` :

```typescript
export function libelleStatut(statut: "PLANIFIEE" | "REALISEE" | "ANNULEE"): string {
  if (statut === "REALISEE") return "Réalisée";
  if (statut === "ANNULEE") return "Annulée";
  return "Planifiée";
}

export function libelleType(type: "PRIVE" | "COLLECTIF"): string {
  return type === "PRIVE" ? "Privé" : "Collectif";
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/planning/libelles.test.ts
```

Expected : SUCCÈS — 2 tests passés.

- [ ] **Step 5: Créer le composant BadgeStatut**

Créer `components/badge-statut.tsx` :

```tsx
import { libelleStatut } from "@/lib/planning/libelles";

type Statut = "PLANIFIEE" | "REALISEE" | "ANNULEE";

const CLASSES: Record<Statut, string> = {
  PLANIFIEE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  REALISEE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ANNULEE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function BadgeStatut({ statut }: { statut: Statut }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[statut]}`}>
      {libelleStatut(statut)}
    </span>
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
git add lib/planning/libelles.ts lib/planning/libelles.test.ts components/badge-statut.tsx
git commit -m "feat(design): libellés planning (TDD) + composant BadgeStatut"
```

---

### Task 2 : Restyle de la liste `/planning`

**Files:**

- Modify: `app/planning/page.tsx`
- Modify: `app/planning/navigation.tsx` (icônes flèches)

**Interfaces:**

- Consumes: `BadgeStatut`, `libelleType`, lucide `ChevronLeft`/`ChevronRight`.

- [ ] **Step 1: Restyler les cartes de séances**

Dans `app/planning/page.tsx` :

1. Mettre à jour les imports : ajouter

```tsx
import { BadgeStatut } from "@/components/badge-statut";
import { libelleType } from "@/lib/planning/libelles";
```

et retirer la fonction locale `StatutBadge` en bas du fichier (elle est remplacée par `BadgeStatut`). 2. Remplacer le contenu du `<li key={s.id}>` (le `<Link>…</Link>`) par :

```tsx
<Link
  href={`/planning/${s.id}`}
  className={`hover:bg-muted flex items-center justify-between gap-3 rounded-lg border border-l-4 p-3 ${
    s.type === "PRIVE" ? "border-l-primary" : "border-l-sky-500"
  }`}
>
  <span className="flex min-w-0 flex-col">
    <span className="font-medium">
      {formatHeureFr(s.dateHeureDebut)} · {libelleType(s.type)}
    </span>
    <span className="text-muted-foreground truncate text-sm">
      {s.participations.map((p) => p.eleve.prenom).join(", ") || "Aucun élève"}
    </span>
  </span>
  <BadgeStatut statut={s.statut} />
</Link>
```

3. Supprimer la fonction `function StatutBadge(...)` en bas du fichier.

- [ ] **Step 2: Mettre des icônes dans la navigation**

Dans `app/planning/navigation.tsx` :

1. Ajouter l'import :

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
```

2. Remplacer le contenu du bouton « ← » par `<ChevronLeft className="size-4" />` et celui du bouton « → » par `<ChevronRight className="size-4" />` (conserver les `onClick` et variantes ; ajouter `aria-label="Précédent"` / `aria-label="Suivant"` respectivement).

- [ ] **Step 3: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Commit**

```bash
git add app/planning/page.tsx app/planning/navigation.tsx
git commit -m "feat(design): séances en cartes colorées par type + badges de statut"
```

---

### Task 3 : Restyle de la fiche `/planning/[id]`

**Files:**

- Modify: `app/planning/[id]/page.tsx`

**Interfaces:**

- Consumes: `BadgeStatut`, `libelleType`, `formatEuros`.

- [ ] **Step 1: Restyler l'en-tête + les infos + le badge de statut**

Dans `app/planning/[id]/page.tsx` :

1. Ajouter les imports :

```tsx
import { BadgeStatut } from "@/components/badge-statut";
import { libelleType } from "@/lib/planning/libelles";
```

2. Remplacer le bloc en-tête (`<div className="mt-2 mb-4 flex items-center justify-between gap-2">…</div>`) par :

```tsx
<div className="mt-2 mb-4 flex items-center justify-between gap-2">
  <div className="flex items-center gap-3">
    <h1 className="text-2xl font-semibold">{libelleType(seance.type)}</h1>
    <BadgeStatut statut={seance.statut} />
  </div>
  <Button variant="outline" render={<Link href={`/planning/${seance.id}/modifier`} />}>
    Modifier
  </Button>
</div>
```

3. Mettre les infos dans une carte : remplacer le `<dl className="mb-6 flex flex-col gap-2 text-sm">` par :

```tsx
      <dl className="mb-6 flex flex-col gap-2 rounded-lg border p-4 text-sm">
```

(le contenu `<Info …>` reste identique, ainsi que le `</dl>`).

(Conserver le reste : liste des participants, `ReglementParticipation`, `ActionsSeance`, la fonction `Info`.)

- [ ] **Step 2: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 3: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /planning` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — cartes colorées, badges — sera fait par l'utilisateur.)

- [ ] **Step 4: Commit**

```bash
git add "app/planning/[id]/page.tsx"
git commit -m "feat(design): fiche séance restylée (type + badge statut, carte infos)"
```

---

### Task 4 : Vérification finale + changelog

**Files:**

- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Lint, tests, build**

Run :

```bash
npm run lint && npm run test:run && npm run build
```

Expected : lint propre, tous les tests passent (dont les libellés), build réussi.

- [ ] **Step 2: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Design 5 : Restyle Planning

- Séances en cartes codées couleur par type (privé / collectif) ; badges de statut colorés.
- Navigation jour/semaine avec icônes ; fiche séance restylée (type + statut, carte d'infos).
```

- [ ] **Step 3: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog design 5 (planning)"
```

(Inclure d'éventuels fichiers reformatés.)

La sous-phase 5 est terminée. Fusion de `feat/design-planning` vers `main` via PR après tests.
(Suivra : D6 Finances, dernière sous-phase de la refonte.)

---

## Self-Review

- **Couverture spec §5 (Planning)** : séances en cartes colorées par type (T2), badges de statut (T1 + T2 + T3), navigation jour/semaine + flèches plus visuelles (T2), fiche séance avec participants + règlement conservés (T3). Comble aussi la « UI gap » notée (code couleur privé/collectif).
- **Périmètre présentation** : seules des classes Tailwind et l'insertion de composants ; aucune requête/action/validation touchée.
- **Statut & type accessibles** : couleur **+ texte** (jamais la couleur seule).
- **Tests** : libellés en TDD (T1) ; suite existante conservée verte (T4) ; test manuel e2e (T3).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `libelleStatut` (T1) consommé par `BadgeStatut` (T1) ; `BadgeStatut`/`libelleType` (T1) consommés par la liste (T2) et la fiche (T3) ; remplacement du `StatutBadge` local par `BadgeStatut`.
