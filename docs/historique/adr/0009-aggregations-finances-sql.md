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
  `packId`) — trois agrégations mutuellement exclusives.
