# Graphiques Finances — camembert + courbe d'évolution

**Date :** 2026-06-21
**Statut :** Design validé (brainstorming)
**Auteur :** Victor

---

## 1. Contexte & objectif

La page `/finances` affiche aujourd'hui le total encaissé, une répartition privé/collectif/packs
(en barres de proportion) et les impayés. On veut deux visualisations :

1. La **répartition** passe en **camembert** (privé / collectif / packs).
2. Un nouveau **graphique en courbe** montre l'**évolution du revenu total** sur la période
   choisie.

**Périmètre :** présentation + une nouvelle agrégation temporelle (lecture seule). Aucune
écriture, Server Action, validation ou règle métier modifiée.

---

## 2. Bibliothèque

- Module graphique **shadcn** (`npx shadcn@latest add chart`) → ajoute la dépendance
  **`recharts`** et un wrapper thématisé (`ChartContainer`, `ChartTooltip`, `ChartLegend`)
  qui mappe les couleurs sur les jetons CSS (corail, etc.) et gère le mode sombre.
- Les deux graphes sont des **composants client** (Recharts s'exécute côté navigateur),
  alimentés par des données calculées côté serveur et passées en props sérialisables.

---

## 3. Données

### Camembert — répartition (donnée existante)

- Réutilise **`getRepartition(debut, fin)`** (déjà en place) → `{ prive, collectif, pack }`
  en `Prisma.Decimal`.
- Les valeurs sont converties en **nombre uniquement pour la taille des parts** (affichage) ;
  les montants des légendes restent affichés via `formatEuros(decimal.toString())`.
- Couleurs des parts : privé = corail (`--primary`), collectif = bleu (sky), packs = ambre.

### Courbe — évolution du revenu (nouvelle agrégation)

- Nouvelle fonction serveur **`getEvolution(debut, fin, granularite): Promise<{ label: string; total: number }[]>`**.
  - Récupère les paiements de `[debut, fin]` (`date`, `montant`).
  - Génère des **intervalles ordonnés** couvrant la plage selon la granularité.
  - Somme les `montant` par intervalle en **arithmétique `Prisma.Decimal`** (exact), puis
    convertit le total en **nombre** seulement pour tracer la courbe (`total`).
  - `label` = libellé court de l'intervalle (heure « 14h », jour « 12 », mois « janv. »).
- **Granularité dérivée du sélecteur de période** (helper `granulariteParPeriode`) :
  - `jour` → **heure** · `semaine` → **jour** · `mois` → **jour** · `annee` → **mois**.

### Logique pure isolée (testée, TDD)

- `granulariteParPeriode(periode): "heure" | "jour" | "mois"`.
- `genererBuckets(debut, fin, granularite): { debut: Date; fin: Date; label: string }[]` —
  intervalles ordonnés couvrant la plage.
- `agregerParBucket(paiements, buckets): { label: string; total: Prisma.Decimal }[]` —
  somme Decimal des paiements dans chaque intervalle (un paiement va dans l'intervalle dont
  `debut <= date <= fin`).
- `getEvolution` orchestre : `genererBuckets` → requête Prisma → `agregerParBucket` →
  conversion `total` en nombre.

---

## 4. UI de la page Finances

Ordre de la page :

1. **Filtres** (période / date / méthode) — inchangés, pilotent toute la page.
2. **Total encaissé** — grande carte corail (inchangée).
3. **Évolution du revenu** _(nouveau)_ — carte avec la **courbe** : X = intervalles, Y = €,
   points reliés, **tooltip** affichant le montant formaté ; titre dynamique selon la période.
4. **Répartition** — la carte devient un **camembert** + **légende** (privé / collectif / packs
   avec montant et couleur).
5. **Impayés** — inchangés.

**Détails**

- Graphes **responsives** (largeur mobile/PC).
- **États vides** : courbe → « Aucun encaissement sur cette période » ; camembert →
  « Rien à répartir » (quand le total de répartition est 0).
- Camembert et courbe restent **« toutes méthodes »** (cohérent avec la répartition actuelle),
  avec mention discrète ; le filtre méthode continue d'agir sur le **total encaissé**.

---

## 5. Tests & qualité

- **TDD** sur la logique pure : `granulariteParPeriode`, `genererBuckets`, `agregerParBucket`
  (dont l'exactitude des sommes Decimal).
- Composants graphiques (camembert/courbe) : non testés unitairement (rendu client) ; validés
  par le **build** + un **test navigateur**.
- **Lint propre, build vert, suite existante au vert** maintenus (aucune logique métier touchée).

---

## 6. Découpage prévu (pour le plan)

1. **Helpers temporels (TDD)** : `granulariteParPeriode`, `genererBuckets`, `agregerParBucket`.
2. **`getEvolution`** (orchestration requête + agrégation) + setup `shadcn add chart` (recharts).
3. **Composants graphiques** : `CamembertRepartition`, `CourbeEvolution` (client).
4. **Intégration page** `/finances` (remplacer les barres par le camembert, insérer la courbe)
   - vérif finale.

Chaque étape testable ; un seul plan + une PR.

---

## 7. Hors périmètre

- Détail de l'évolution par catégorie (la courbe reste le **total**).
- Filtre méthode appliqué aux graphes (ils restent « toutes méthodes »).
- Export, comparaison entre périodes, prévisions.
