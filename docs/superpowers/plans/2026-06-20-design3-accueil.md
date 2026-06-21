# Design 3 — Tableau de bord d'accueil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'accueil (`/`) en **tableau de bord du jour** : salutation + date, les **séances d'aujourd'hui** (le prochain cours mis en avant), des **raccourcis d'action**, et un **aperçu finances** compact — pour comprendre en un coup d'œil quoi faire.

**Architecture:** `app/page.tsx` (Server Component, gardé par `requireCoach()`) lit les séances du jour via Prisma et réutilise les helpers finances existants (`getRevenuTotal`, `getImpayes`). Un petit helper pur `prochaineSeance` (testé) détermine le prochain cours. Aucune logique métier nouvelle ; les requêtes financières restent en SQL/Decimal.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Prisma v7, Vitest, Tailwind + shadcn/ui, lucide-react.

## Global Constraints

- Périmètre **présentation** : on réutilise les helpers/queries existants ; pas de nouvelle logique métier ni de calcul en flottant.
- Page `/` gardée par `requireCoach()`. Mobile-first.
- Le **doublon de déconnexion** sur l'accueil (resté de Design 1/2) est **retiré** (la déconnexion vit dans la coquille de navigation).
- Le **prochain cours** = première séance du jour dont `dateHeureDebut >= maintenant` ; mise en avant en **corail**.
- Sommes monétaires via les helpers SQL/Decimal existants ; `formatEuros` pour l'affichage uniquement.
- Build vert, lint propre, tests existants au vert + un test pour `prochaineSeance` (TDD).
- Git : branche `feat/design-accueil` (déjà active), commits petits, jamais de push direct sur `main`.
- Environnement : Windows, shell PowerShell. `Button` = base-ui (`render`, pas `asChild`).

---

### Task 1 : Helper `prochaineSeance` (TDD)

**Files:**

- Create: `lib/accueil.ts`, `lib/accueil.test.ts`

**Interfaces:**

- Produces: `prochaineSeance<T extends { dateHeureDebut: Date }>(seances: T[], maintenant: Date): T | null` — renvoie la première séance dont `dateHeureDebut >= maintenant` (les séances sont supposées triées par heure croissante), sinon `null`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/accueil.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { prochaineSeance } from "./accueil";

const s = (h: number) => ({ id: `${h}h`, dateHeureDebut: new Date(2026, 5, 20, h, 0) });

describe("prochaineSeance", () => {
  const maintenant = new Date(2026, 5, 20, 12, 0);

  it("renvoie null si la liste est vide", () => {
    expect(prochaineSeance([], maintenant)).toBeNull();
  });

  it("renvoie null si toutes les séances sont passées", () => {
    expect(prochaineSeance([s(8), s(10)], maintenant)).toBeNull();
  });

  it("renvoie la première séance à venir", () => {
    const r = prochaineSeance([s(8), s(14), s(18)], maintenant);
    expect(r?.id).toBe("14h");
  });

  it("inclut une séance pile à l'heure courante (>=)", () => {
    const r = prochaineSeance([s(10), s(12), s(15)], maintenant);
    expect(r?.id).toBe("12h");
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/accueil.test.ts
```

Expected : ÉCHEC — `Cannot find module './accueil'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/accueil.ts` :

```typescript
export function prochaineSeance<T extends { dateHeureDebut: Date }>(
  seances: T[],
  maintenant: Date,
): T | null {
  return seances.find((s) => s.dateHeureDebut.getTime() >= maintenant.getTime()) ?? null;
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/accueil.test.ts
```

Expected : SUCCÈS — 4 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/accueil.ts lib/accueil.test.ts
git commit -m "feat(design): helper prochaineSeance pour l'accueil (TDD)"
```

---

### Task 2 : Refonte de l'accueil en tableau de bord

**Files:**

- Modify: `app/page.tsx` (remplacement complet)

**Interfaces:**

- Consumes: `requireCoach`, `prisma`, `Prisma` (`@prisma/client`), `startOfDay`/`endOfDay` (`@/lib/planning/dates`), `rangePeriode` (`@/lib/finances/periode`), `getRevenuTotal`/`getImpayes` (`@/lib/finances/dashboard`), `formatJourFr`/`formatHeureFr` (`@/lib/planning/format`), `formatEuros` (`@/lib/finances/format`), `prochaineSeance` (`@/lib/accueil`), icônes lucide.

- [ ] **Step 1: Remplacer entièrement `app/page.tsx`**

Remplacer tout le contenu de `app/page.tsx` par :

```tsx
import Link from "next/link";
import { CalendarPlus, UserPlus } from "lucide-react";
import { Prisma } from "@prisma/client";
import { requireCoach } from "@/lib/auth/require-coach";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/planning/dates";
import { rangePeriode } from "@/lib/finances/periode";
import { getRevenuTotal, getImpayes } from "@/lib/finances/dashboard";
import { formatJourFr, formatHeureFr } from "@/lib/planning/format";
import { formatEuros } from "@/lib/finances/format";
import { prochaineSeance } from "@/lib/accueil";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  await requireCoach();
  const maintenant = new Date();

  const seancesDuJour = await prisma.seance.findMany({
    where: { dateHeureDebut: { gte: startOfDay(maintenant), lte: endOfDay(maintenant) } },
    orderBy: { dateHeureDebut: "asc" },
    include: { participations: { include: { eleve: true } } },
  });
  const prochaine = prochaineSeance(seancesDuJour, maintenant);

  const { debut, fin } = rangePeriode("mois", maintenant);
  const [encaisseMois, impayes] = await Promise.all([getRevenuTotal(debut, fin), getImpayes()]);
  const totalImpayes = impayes.reduce((acc, i) => acc.add(i.total), new Prisma.Decimal(0));

  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Bonjour 👋</h1>
        <p className="text-muted-foreground text-sm capitalize">{formatJourFr(maintenant)}</p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">Aujourd&apos;hui</h2>
        {seancesDuJour.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground mb-3">Aucune séance prévue aujourd&apos;hui.</p>
            <Button render={<Link href="/planning/nouvelle" />}>Planifier une séance</Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {seancesDuJour.map((s) => {
              const estProchaine = prochaine?.id === s.id;
              return (
                <li key={s.id}>
                  <Link
                    href={`/planning/${s.id}`}
                    className={`hover:bg-muted flex items-center justify-between rounded-lg border p-3 ${
                      estProchaine ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">
                        {formatHeureFr(s.dateHeureDebut)} ·{" "}
                        {s.type === "PRIVE" ? "Privé" : "Collectif"}
                        {estProchaine ? (
                          <span className="text-primary font-semibold"> · prochain</span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {s.participations.map((p) => p.eleve.prenom).join(", ") || "Aucun élève"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <Button render={<Link href="/planning/nouvelle" />}>
          <CalendarPlus className="size-4" /> Nouvelle séance
        </Button>
        <Button variant="outline" render={<Link href="/eleves/nouveau" />}>
          <UserPlus className="size-4" /> Nouvel élève
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/finances" className="hover:bg-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Encaissé ce mois</p>
          <p className="text-xl font-semibold">{formatEuros(encaisseMois.toString())}</p>
        </Link>
        <Link href="/finances" className="hover:bg-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-xs">Impayés</p>
          <p className="text-xl font-semibold">{formatEuros(totalImpayes.toString())}</p>
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi. (Le doublon « Se déconnecter » a disparu de l'accueil ; la déconnexion reste accessible via la coquille.)

- [ ] **Step 3: Test manuel CLI**

Run :

```bash
npm run dev
```

Vérifier (non authentifié) : `GET /` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — voir les séances du jour, le prochain cours en corail, l'aperçu finances — sera fait par l'utilisateur.) Noter dans le rapport.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(design): accueil = tableau de bord du jour (séances, raccourcis, finances)"
```

---

### Task 3 : Vérification finale + changelog

**Files:**

- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Lint, tests, build**

Run :

```bash
npm run lint && npm run test:run && npm run build
```

Expected : lint propre, tous les tests passent (dont `prochaineSeance`), build réussi.

- [ ] **Step 2: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-20 — Design 3 : Tableau de bord d'accueil

- Accueil refondu : séances du jour (prochain cours en avant), raccourcis, aperçu finances (encaissé du mois / impayés).
- Doublon de déconnexion retiré de l'accueil (présent dans la coquille de navigation).
```

- [ ] **Step 3: Formater et committer**

Run :

```bash
npm run format
```

Puis :

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog design 3 (accueil)"
```

(Inclure d'éventuels fichiers reformatés.)

La sous-phase 3 est terminée : l'accueil est un vrai tableau de bord du jour. Fusion de
`feat/design-accueil` vers `main` via PR après tests. (Suivront : D4 Élèves, D5 Planning, D6 Finances.)

---

## Self-Review

- **Couverture spec §4 (accueil)** : salutation + date (T2), séances du jour triées + prochain cours en corail (T1 + T2), raccourcis Nouvelle séance / Nouvel élève (T2), aperçu finances encaissé/impayés cliquable (T2), déconnexion retirée (T2, vit dans la coquille).
- **Périmètre présentation** : réutilise `getRevenuTotal`/`getImpayes`/`rangePeriode`/`startOfDay`/`endOfDay` ; aucune nouvelle requête métier ; sommes Decimal (impayés via `Prisma.Decimal.add`).
- **Tests** : `prochaineSeance` en TDD (T1) ; suite existante conservée verte (T3) ; test manuel e2e (T2).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `prochaineSeance` (T1) consommé par l'accueil (T2) ; helpers finances/planning réutilisés tels quels.
- **Note** : `requireCoach()` remplace `auth()` sur l'accueil (garde explicite + cohérence) ; l'email de session n'est plus affiché (salutation générique).
