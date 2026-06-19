# Phase 5a — Paiements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre d'encaisser au cas par cas : sur une séance, marquer la participation d'un élève comme **payée** (espèces / CB / virement) — ce qui crée un _Paiement_ — et pouvoir **annuler** ce paiement. Protéger l'intégrité des revenus en **bloquant la suppression définitive d'un élève** qui a un historique (séances ou paiements) : on force l'archivage.

**Architecture:** Server Actions gardées par `requireCoach()` dans `lib/finances/actions.ts`. Le montant du paiement reprend le `montant` déjà stocké sur la `Participation` (un `Decimal` en base) — aucun montant n'est ressaisi, donc pas de risque de flottant à cette étape. UI mobile-first sur la fiche séance (existante) : un bloc « règlement » par participant. La garde de suppression d'élève vit dans `lib/eleves/actions.ts` (re-vérifiée côté serveur) + l'UI de la fiche élève.

**Tech Stack:** Next.js 16 (App Router, Server Actions), TypeScript strict, Prisma v7 (modèles `Paiement`/`Participation`/`Eleve` existants), Zod v4, Vitest, Tailwind + shadcn/ui.

## Global Constraints

- Mono-utilisateur : toutes les Server Actions de paiement exigent une session (`requireCoach()`).
- TypeScript strict partout.
- Pas de migration de schéma (modèles `Paiement`, `Participation`, enum `MethodePaiement`/`StatutReglement` existent depuis la phase 1).
- Le montant d'un paiement « à la séance » = `montant` de la participation (déjà en base) ; on ne ressaisit pas de montant en 5a.
- Une participation `A_REGLER` peut être marquée payée (→ `PAYE`) ; une participation `PAYE` peut être annulée (→ `A_REGLER`). `COUVERT_PAR_PACK` est géré en 5b (afficher seulement).
- Suppression définitive d'un élève **bloquée** s'il a au moins une participation, un pack ou un paiement → proposer l'archivage.
- Secrets uniquement dans `.env`. Git : branche `feat/paiements`, commits petits, jamais de push direct sur `main`.
- Décision d'architecture notable → ADR dans `docs/historique/adr/`.
- Environnement : Windows, shell PowerShell.

---

### Task 1 : Helper de formatage monétaire (TDD)

**Files:**

- Create: `lib/finances/format.ts`, `lib/finances/format.test.ts`

**Interfaces:**

- Produces: `formatEuros(value: string | number): string` — formate un montant en euros façon FR (ex. `15` → « 15,00 € »). Accepte une chaîne (sortie `Decimal.toString()`) ou un nombre.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `lib/finances/format.test.ts` :

```typescript
import { describe, it, expect } from "vitest";
import { formatEuros } from "./format";

describe("formatEuros", () => {
  it("formate un entier", () => {
    expect(formatEuros(15)).toBe("15,00 €");
  });

  it("formate une chaîne décimale (sortie Prisma Decimal)", () => {
    expect(formatEuros("15.5")).toBe("15,50 €");
  });

  it("formate zéro", () => {
    expect(formatEuros("0")).toBe("0,00 €");
  });
});
```

> Note : `Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })` produit une espace insécable avant `€`. Si l'égalité stricte échoue à cause du type d'espace, l'implémentation ci-dessous normalise l'espace en espace simple pour des tests déterministes.

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run :

```bash
npm run test:run -- lib/finances/format.test.ts
```

Expected : ÉCHEC — `Cannot find module './format'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `lib/finances/format.ts` :

```typescript
export function formatEuros(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(safe)
    .replace(/ | /g, " ");
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run :

```bash
npm run test:run -- lib/finances/format.test.ts
```

Expected : SUCCÈS — 3 tests passés.

- [ ] **Step 5: Commit**

```bash
git add lib/finances/format.ts lib/finances/format.test.ts
git commit -m "feat: helper de formatage monétaire en euros (TDD)"
```

---

### Task 2 : Server Actions de paiement

**Files:**

- Create: `lib/finances/actions.ts`

**Interfaces:**

- Consumes: `requireCoach`, `prisma`.
- Produces (Server Actions `"use server"`) :
  - `marquerPaye(participationId: string, methode: MethodePaiement): Promise<void>` — si la participation est `A_REGLER`, crée un `Paiement` (montant = `participation.montant`, méthode, élève, participation) et passe la participation à `PAYE`. Idempotent (no-op si pas `A_REGLER`).
  - `annulerPaiement(participationId: string): Promise<void>` — si la participation est `PAYE`, supprime le paiement lié et repasse à `A_REGLER`. Idempotent.

- [ ] **Step 1: Écrire les Server Actions**

Créer `lib/finances/actions.ts` :

```typescript
"use server";

import { revalidatePath } from "next/cache";
import type { MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";

export async function marquerPaye(
  participationId: string,
  methode: MethodePaiement,
): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "A_REGLER") return;

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

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
}

export async function annulerPaiement(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "PAYE") return;

  await prisma.$transaction([
    prisma.paiement.deleteMany({ where: { participationId } }),
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "A_REGLER" },
    }),
  ]);

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
}
```

- [ ] **Step 2: Vérifier la compilation**

Run :

```bash
npm run build
```

Expected : build réussi (actions pas encore utilisées par une page — attendu).

- [ ] **Step 3: Commit**

```bash
git add lib/finances/actions.ts
git commit -m "feat: Server Actions de paiement (marquer payé / annuler)"
```

---

### Task 3 : Règlement sur la fiche séance (UI)

**Files:**

- Create: `app/planning/[id]/reglement-participation.tsx`
- Modify: `app/planning/[id]/page.tsx` (afficher le bloc règlement par participant)

**Interfaces:**

- Consumes: `marquerPaye`/`annulerPaiement`, `formatEuros`.
- Produces: pour chaque participation, statut de règlement + actions (marquer payé par méthode, ou annuler).

- [ ] **Step 1: Créer le composant de règlement (client)**

Créer `app/planning/[id]/reglement-participation.tsx` :

```tsx
"use client";

import type { MethodePaiement, StatutReglement } from "@prisma/client";
import { marquerPaye, annulerPaiement } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";

const METHODES: Array<[MethodePaiement, string]> = [
  ["ESPECES", "Espèces"],
  ["CB", "CB"],
  ["VIREMENT", "Virement"],
];

const LIBELLE_METHODE: Record<MethodePaiement, string> = {
  ESPECES: "Espèces",
  CB: "CB",
  VIREMENT: "Virement",
};

export function ReglementParticipation({
  participationId,
  statut,
  methode,
}: {
  participationId: string;
  statut: StatutReglement;
  methode: MethodePaiement | null;
}) {
  if (statut === "PAYE") {
    return (
      <span className="flex items-center gap-2">
        <span className="text-sm text-green-700">
          Payé{methode ? ` · ${LIBELLE_METHODE[methode]}` : ""}
        </span>
        <form action={annulerPaiement.bind(null, participationId)}>
          <Button type="submit" variant="ghost" size="sm">
            Annuler
          </Button>
        </form>
      </span>
    );
  }

  if (statut === "COUVERT_PAR_PACK") {
    return <span className="text-sm text-blue-700">Couvert par un pack</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {METHODES.map(([value, label]) => (
        <form key={value} action={marquerPaye.bind(null, participationId, value)}>
          <Button type="submit" variant="outline" size="sm">
            {label}
          </Button>
        </form>
      ))}
    </span>
  );
}
```

- [ ] **Step 2: Afficher le règlement dans la fiche séance**

Dans `app/planning/[id]/page.tsx` :

1. Étendre la requête Prisma pour inclure le paiement de chaque participation :

```tsx
const seance = await prisma.seance.findUnique({
  where: { id },
  include: { participations: { include: { eleve: true, paiement: true } } },
});
```

2. Importer les helpers en tête de fichier :

```tsx
import { formatEuros } from "@/lib/finances/format";
import { ReglementParticipation } from "./reglement-participation";
```

3. Remplacer le contenu de chaque `<li>` de la liste des participants par :

```tsx
<li
  key={p.id}
  className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
>
  <Link href={`/eleves/${p.eleveId}`} className="font-medium hover:underline">
    {p.eleve.prenom} {p.eleve.nom}
  </Link>
  <span className="flex items-center gap-3">
    <span className="text-muted-foreground">{formatEuros(p.montant.toString())}</span>
    <ReglementParticipation
      participationId={p.id}
      statut={p.statutReglement}
      methode={p.paiement?.methode ?? null}
    />
  </span>
</li>
```

(Conserver le reste de la page inchangé.)

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

Vérifier (non authentifié) : `GET /planning` → 307 vers `/login`. Arrêter le serveur. (Le test connecté complet — marquer payé / annuler — sera fait par l'utilisateur.) Noter dans le rapport.

- [ ] **Step 5: Commit**

```bash
git add "app/planning/[id]/reglement-participation.tsx" "app/planning/[id]/page.tsx"
git commit -m "feat: règlement des participations sur la fiche séance (payé/annuler)"
```

---

### Task 4 : Bloquer la suppression d'un élève avec historique

**Files:**

- Modify: `lib/eleves/actions.ts` (`deleteEleve` défensif)
- Modify: `app/eleves/[id]/page.tsx` (calcul `peutSupprimer`)
- Modify: `app/eleves/[id]/actions-eleve.tsx` (masquer la suppression si historique)
- Create (ADR): `docs/historique/adr/0007-suppression-eleve-bloquee-historique.md`

**Interfaces:**

- `deleteEleve(id)` : refuse de supprimer si l'élève a une participation, un pack ou un paiement ; dans ce cas il **archive** l'élève (sécurité côté serveur) et redirige vers la fiche.
- La fiche élève calcule `peutSupprimer` (aucun historique) et le passe à `ActionsEleve`, qui n'affiche le bouton « Supprimer » que si `peutSupprimer`.

- [ ] **Step 1: Rendre `deleteEleve` défensif**

Dans `lib/eleves/actions.ts`, remplacer le corps de `deleteEleve` par :

```typescript
export async function deleteEleve(id: string): Promise<void> {
  await requireCoach();
  const [participations, packs, paiements] = await Promise.all([
    prisma.participation.count({ where: { eleveId: id } }),
    prisma.pack.count({ where: { eleveId: id } }),
    prisma.paiement.count({ where: { eleveId: id } }),
  ]);
  if (participations + packs + paiements > 0) {
    // Sécurité : un élève avec historique ne peut pas être supprimé → on archive.
    await prisma.eleve.update({ where: { id }, data: { archive: true } });
    revalidatePath("/eleves");
    revalidatePath(`/eleves/${id}`);
    redirect(`/eleves/${id}`);
  }
  await prisma.eleve.delete({ where: { id } });
  revalidatePath("/eleves");
  redirect("/eleves");
}
```

- [ ] **Step 2: Calculer `peutSupprimer` dans la fiche élève**

Dans `app/eleves/[id]/page.tsx`, après avoir chargé `eleve` (et avant le rendu), ajouter :

```tsx
const [nbParticipations, nbPacks, nbPaiements] = await Promise.all([
  prisma.participation.count({ where: { eleveId: eleve.id } }),
  prisma.pack.count({ where: { eleveId: eleve.id } }),
  prisma.paiement.count({ where: { eleveId: eleve.id } }),
]);
const peutSupprimer = nbParticipations + nbPacks + nbPaiements === 0;
```

Puis passer la prop à `ActionsEleve` :

```tsx
<ActionsEleve id={eleve.id} archive={eleve.archive} peutSupprimer={peutSupprimer} />
```

- [ ] **Step 3: Adapter `ActionsEleve`**

Dans `app/eleves/[id]/actions-eleve.tsx`, modifier la signature et le rendu du bouton de suppression :

```tsx
export function ActionsEleve({
  id,
  archive,
  peutSupprimer,
}: {
  id: string;
  archive: boolean;
  peutSupprimer: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={() => setArchiveEleve(id, !archive)}>
        <Button type="submit" variant="outline">
          {archive ? "Désarchiver" : "Archiver"}
        </Button>
      </form>
      {peutSupprimer ? (
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
      ) : (
        <p className="text-muted-foreground text-sm">
          Suppression impossible : l&apos;élève a un historique. Archivez-le.
        </p>
      )}
    </div>
  );
}
```

(L'import de `deleteEleve` reste nécessaire.)

- [ ] **Step 4: Écrire l'ADR**

Créer `docs/historique/adr/0007-suppression-eleve-bloquee-historique.md` :

```markdown
# ADR 0007 — Suppression d'un élève bloquée s'il a un historique

**Date :** 2026-06-19
**Statut :** Accepté

## Contexte

Supprimer un élève fait cascader la suppression de ses participations, packs et paiements
(contraintes `onDelete: Cascade`). Or les paiements sont la source de vérité des revenus :
les effacer fausserait les chiffres financiers.

## Décision

La suppression définitive d'un élève est interdite dès qu'il a au moins une participation,
un pack ou un paiement. L'UI masque alors le bouton « Supprimer » et propose l'archivage.
Côté serveur, `deleteEleve` re-vérifie et, par sécurité, archive au lieu de supprimer si un
historique existe.

## Alternatives écartées

- Autoriser la suppression avec un avertissement : risque de perte de données financières.
- Suppression logique partout (jamais de hard delete) : on garde la suppression pour les
  élèves sans aucun historique (RGPD, élève créé par erreur).

## Conséquences

- Les revenus enregistrés ne peuvent jamais être effacés via la suppression d'un élève.
- Un élève ayant un historique se gère par archivage.
```

- [ ] **Step 5: Vérifier le build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 6: Commit**

```bash
git add lib/eleves/actions.ts "app/eleves/[id]/page.tsx" "app/eleves/[id]/actions-eleve.tsx" docs/historique/adr/0007-suppression-eleve-bloquee-historique.md
git commit -m "feat: bloquer la suppression d'un élève avec historique (force archivage) + ADR 0007"
```

---

### Task 5 : Vérification finale + changelog

**Files:**

- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: Lint**

Run :

```bash
npm run lint
```

Expected : aucune erreur (corriger toute apostrophe non échappée des nouveaux fichiers si besoin).

- [ ] **Step 2: Tests**

Run :

```bash
npm run test:run
```

Expected : tous les tests passent (auth + élèves + planning + finances/format + smoke).

- [ ] **Step 3: Build**

Run :

```bash
npm run build
```

Expected : build réussi.

- [ ] **Step 4: Mettre à jour le changelog**

Ajouter en haut de `docs/historique/CHANGELOG.md` :

```markdown
## 2026-06-19 — Phase 5a : Paiements

- Marquer une participation payée (espèces / CB / virement) sur la fiche séance ; annuler un paiement.
- Suppression d'un élève bloquée s'il a un historique (force l'archivage) — ADR 0007.
- Helper de formatage monétaire (€) testé (TDD).
```

- [ ] **Step 5: Formater et vérifier l'état Git**

Run :

```bash
npm run format
git status
```

Inclure d'éventuels composants shadcn reformatés.

- [ ] **Step 6: Commit**

```bash
git add docs/historique/CHANGELOG.md
git commit -m "docs: changelog phase 5a (paiements)"
```

La sous-phase 5a est terminée : encaissement au cas par cas (payé / annulé) sur la fiche séance,
et protection des revenus contre la suppression d'élève. Fusion de `feat/paiements` vers `main`
via PR après tests. (Suivront : 5b Packs, 5c Tableau de bord finances.)

---

## Self-Review

- **Couverture du périmètre 5a** : marquer payé par méthode (T2 + UI T3), annuler (T2 + UI T3), blocage suppression élève avec historique (T4).
- **Sécurité (§5)** : `requireCoach()` sur chaque action (T2, et `deleteEleve` T4) ; le montant du paiement vient de la base (pas de saisie → pas de flottant en 5a).
- **Intégrité des revenus** : un paiement ne peut être effacé que via « Annuler » (volontaire) ; la suppression d'élève ne peut plus détruire de paiements (T4).
- **Tests (§6)** : helper monétaire en TDD (T1) ; test manuel e2e (T3).
- **Traçabilité (§7)** : ADR 0007 (T4), changelog (T5).
- **Placeholders** : aucun — code complet à chaque étape.
- **Cohérence des types** : `marquerPaye`/`annulerPaiement` (T2) consommés par `ReglementParticipation` (T3) ; `formatEuros` (T1) consommé en T3 ; `peutSupprimer` ajouté en T4 (fiche → `ActionsEleve`).
- **Adaptations connues** : `Button` base-ui (les boutons de règlement utilisent `type="submit"` dans des `<form action={…bind}>`, pas de `asChild` ici) ; penser au reformatage Prettier des composants.
- **Note 5b/5c** : le helper monétaire « saisie → string Decimal » (pour les prix tapés) sera introduit en 5b (création de pack) où un montant est saisi ; la sommation fiable des revenus sera traitée en 5c.
