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

- Règlement par pack en un clic ; annulation re-crédite le pack consommé (via le `packId`
  mémorisé sur la participation, donc le bon pack même si l'élève en a acheté un autre depuis).
- Le solde d'un pack ne descend jamais sous 0 (le bouton n'apparaît que si un pack est dispo,
  et l'action revérifie `nbSeancesRestantes > 0`).
