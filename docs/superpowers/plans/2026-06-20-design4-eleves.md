# Design 4 — Restyle Élèves — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embellir les écrans Élèves : **pastilles d'initiales**, listes en cartes aérées, et fiche claire avec **jauge de séances restantes** sur les packs — sans changer la logique.

**Architecture:** Deux composants présentationnels réutilisables (`Initiales`, `JaugePack`) s'appuyant sur un helper pur `initiales` (testé). Les pages `/eleves` et `/eleves/[id]` sont restylées (classes Tailwind + ces composants). Aucune requête, Server Action ou validation n'est modifiée.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Vitest, Tailwind + shadcn/ui, lucide-react.

## Global Constraints

- Périmètre **présentation** : aucune logique métier, requête, Server Action ou validation modifiée.
- Composants `Initiales`/`JaugePack` **présentationnels** (utilisables dans des Server Components).
- Couleur d'accent corail réutilisée via les jetons (`bg-primary/10`, `text-primary`, `bg-primary`).
- Build vert, lint propre, tests existants au vert + un test pour `initiales` (TDD).
- Git : branche `feat/design-eleves` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell. `Button` = base-ui (`render`, pas `asChild`).

---

### Task 1 : Helper `initiales` (TDD) + composants `Initiales` & `JaugePack`

**Files:**

- Create: `lib/eleves/initiales.ts`, `lib/eleves/initiales.test.ts`
- Create: `components/initiales.tsx`, `components/jauge-pack.tsx`

**Interfaces:**

- Produces:
  - `initiales(prenom: string, nom: string): string` — 1re lettre du prénom + 1re lettre du nom, en majuscules ; `"?"` si vide.
  - `Initiales` — pastille ronde affichant les initiales (corail).
  - `JaugePack` — barre de progression des séances restantes.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/eleves/initiales.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { initiales } from "./initiales";

describe("initiales", () => {
  it("prend la 1re lettre du prénom et du nom en majuscules", () => {
    expect(initiales("Jean", "Dupont")).toBe("JD");
    expect(initiales("victor", "despirlet")).toBe("VD");
  });

  it("gère un prénom ou un nom vide", () => {
    expect(initiales("", "Dupont")).toBe("D");
    expect(initiales("Jean", "")).toBe("J");
  });

  it("renvoie ? si tout est vide", () => {
    expect(initiales("", "")).toBe("?");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/eleves/initiales.test.ts
```

Expected : ÉCHEC — `Cannot find module './initiales'`.

- [ ] **Step 3: Écrire le helper**

Créer `lib/eleves/initiales.ts` :

```typescript
export function initiales(prenom: string, nom: string): string {
  const p = prenom.trim()[0] ?? "";
  const n = nom.trim()[0] ?? "";
  return (p + n).toUpperCase() || "?";
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/eleves/initiales.test.ts
```

Expected : SUCCÈS — 3 tests passés.

- [ ] **Step 5: Créer le composant Initiales**

Créer `components/initiales.tsx` :

```tsx
import { initiales } from "@/lib/eleves/initiales";
import { cn } from "@/lib/utils";

export function Initiales({
  prenom,
  nom,
  className,
}: {
  prenom: string;
  nom: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
      aria-hidden="true"
    >
      {initiales(prenom, nom)}
    </span>
  );
}
```

- [ ] **Step 6: Créer le composant JaugePack**

Créer `components/jauge-pack.tsx` :

```tsx
export function JaugePack({ restantes, total }: { restantes: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((restantes / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">
        {restantes}/{total} séances restantes
      </span>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 8: Commit**

```bash
git add lib/eleves/initiales.ts lib/eleves/initiales.test.ts components/initiales.tsx components/jauge-pack.tsx
git commit -m "feat(design): helper initiales (TDD) + composants Initiales et JaugePack"
```

---

### Task 2 : Restyle de la liste `/eleves`

**Files:**

- Modify: `app/eleves/page.tsx`
- Modify: `app/eleves/recherche.tsx` (icône de recherche)

**Interfaces:**

- Consumes: `Initiales`, lucide `ChevronRight`/`Search`.

- [ ] **Step 1: Restyler la liste**

Remplacer le `return (...)` de `app/eleves/page.tsx` par :

```tsx
return (
  <main className="mx-auto w-full max-w-2xl p-4">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold">Élèves</h1>
      <Button render={<Link href="/eleves/nouveau" />}>Nouvel élève</Button>
    </div>

    <div className="mb-3">
      <RechercheEleves />
    </div>

    <div className="mb-4">
      <Link
        href={showArchived ? "/eleves" : "/eleves?archives=1"}
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
      >
        {showArchived ? "← Voir les élèves actifs" : "Voir les élèves archivés"}
      </Link>
    </div>

    {eleves.length === 0 ? (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground mb-3 text-sm">
          Aucun élève {showArchived ? "archivé" : ""} pour le moment.
        </p>
        {!showArchived ? (
          <Button render={<Link href="/eleves/nouveau" />}>Ajouter un élève</Button>
        ) : null}
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {eleves.map((e) => (
          <li key={e.id}>
            <Link
              href={`/eleves/${e.id}`}
              className="hover:bg-muted flex items-center gap-3 rounded-lg border p-3"
            >
              <Initiales prenom={e.prenom} nom={e.nom} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  {e.prenom} {e.nom}
                </span>
                {e.telephone ? (
                  <span className="text-muted-foreground text-sm">{e.telephone}</span>
                ) : null}
              </span>
              <ChevronRight className="text-muted-foreground ml-auto size-5" />
            </Link>
          </li>
        ))}
      </ul>
    )}
  </main>
);
```

Puis mettre à jour les imports en tête du fichier :

```tsx
import { ChevronRight } from "lucide-react";
import { Initiales } from "@/components/initiales";
```

(Conserver les autres imports et toute la partie données inchangée.)

- [ ] **Step 2: Ajouter une icône à la recherche**

Remplacer le contenu de `app/eleves/recherche.tsx` par :

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RechercheEleves() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Rechercher un élève…"
        defaultValue={params.get("q") ?? ""}
        className="pl-9"
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("q", e.target.value);
          else next.delete("q");
          router.replace(`/eleves?${next.toString()}`);
        }}
      />
    </div>
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
git add app/eleves/page.tsx app/eleves/recherche.tsx
git commit -m "feat(design): liste des élèves en cartes avec pastilles + recherche"
```

---

### Task 3 : Restyle de la fiche `/eleves/[id]`

**Files:**

- Modify: `app/eleves/[id]/page.tsx`

**Interfaces:**

- Consumes: `Initiales`, `JaugePack`.

- [ ] **Step 1: Restyler la fiche**

Dans `app/eleves/[id]/page.tsx` :

1. Ajouter les imports en tête :

```tsx
import { Initiales } from "@/components/initiales";
import { JaugePack } from "@/components/jauge-pack";
```

2. Remplacer le bloc en-tête (du `<Link href="/eleves" …>← Retour…` jusqu'au badge « Archivé » inclus) par :

```tsx
      <Link href="/eleves" className="text-muted-foreground text-sm">
        ← Retour à la liste
      </Link>
      <div className="mt-2 mb-4 flex items-center gap-3">
        <Initiales prenom={eleve.prenom} nom={eleve.nom} className="size-12 text-base" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-2xl font-semibold">
            {eleve.prenom} {eleve.nom}
          </h1>
          {eleve.archive ? (
            <span className="text-muted-foreground text-xs">Archivé</span>
          ) : null}
        </div>
        <Button variant="outline" render={<Link href={`/eleves/${eleve.id}/modifier`} />}>
          Modifier
        </Button>
      </div>
```

3. Remplacer le bloc `<dl …>…</dl>` (les infos) par une carte :

```tsx
<dl className="mb-6 flex flex-col gap-2 rounded-lg border p-4 text-sm">
  <Info label="Téléphone" value={eleve.telephone} />
  <Info label="Email" value={eleve.email} />
  <Info label="Notes" value={eleve.notes} />
</dl>
```

4. Remplacer la liste des packs (le `<ul>…</ul>` à l'intérieur de la section Packs) par des cartes avec jauge :

```tsx
<ul className="mb-3 flex flex-col gap-2">
  {packs.map((p) => (
    <li key={p.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <JaugePack restantes={p.nbSeancesRestantes} total={p.nbSeancesTotal} />
      </div>
      <span className="text-muted-foreground text-sm">{formatEuros(p.montantPaye.toString())}</span>
    </li>
  ))}
</ul>
```

(Conserver le reste : `Info`, `PackForm`, `ActionsEleve`, et toute la logique de chargement.)

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

Vérifier (non authentifié) : `GET /eleves` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — pastilles, jauges de packs — sera fait par l'utilisateur.)

- [ ] **Step 4: Commit**

```bash
git add "app/eleves/[id]/page.tsx"
git commit -m "feat(design): fiche élève restylée (pastille, carte infos, jauge de packs)"
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

Expected : lint propre, tous les tests passent (dont `initiales`), build réussi.

- [ ] **Step 2: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Design 4 : Restyle Élèves

- Liste des élèves en cartes avec pastilles d'initiales ; recherche avec icône.
- Fiche élève restylée : en-tête avec pastille, carte d'infos, packs avec jauge de séances restantes.
```

- [ ] **Step 3: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog design 4 (élèves)"
```

(Inclure d'éventuels fichiers reformatés.)

La sous-phase 4 est terminée : les écrans Élèves ont une vraie identité visuelle. Fusion de
`feat/design-eleves` vers `main` via PR après tests. (Suivront : D5 Planning, D6 Finances.)

---

## Self-Review

- **Couverture spec §5 (Élèves)** : recherche en évidence (T2), liste en lignes/cartes avec initiales en pastille (T1 + T2), fiche claire (infos, packs avec jauge de séances restantes) (T1 + T3).
- **Périmètre présentation** : seules des classes Tailwind et l'insertion de composants présentationnels ; aucune requête/action/validation touchée.
- **Tests** : `initiales` en TDD (T1) ; suite existante conservée verte (T4) ; test manuel e2e (T3).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `initiales` (T1) consommé par `Initiales` (T1) ; `Initiales`/`JaugePack` (T1) consommés par la liste (T2) et la fiche (T3).
- **Accessibilité** : la pastille `Initiales` est `aria-hidden` (le nom complet est lu juste à côté) ; l'icône de recherche est décorative.
