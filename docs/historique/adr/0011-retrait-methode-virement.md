# ADR 0011 — Retrait de la méthode de paiement « Virement »

**Date :** 2026-06-22
**Statut :** Accepté

## Contexte

Le coach considère « Virement » et « CB » comme une seule et même chose dans son
suivi. Conserver les deux dans le menu de méthode de paiement n'apporte rien et
alourdit l'interface.

## Décision

Supprimer complètement la valeur `VIREMENT` de l'enum `MethodePaiement` (schéma +
migration), et non seulement la masquer dans l'interface. La migration convertit
d'abord tout paiement existant en `VIREMENT` vers `CB` (puisqu'ils sont
équivalents), puis recrée l'enum sans la valeur. Méthodes restantes : `ESPECES`,
`CB`.

## Alternatives écartées

- **Masquer uniquement dans l'UI, garder l'enum** : moins propre, laisse une
  valeur morte dans le schéma et la validation.

## Conséquences

- Migration non triviale (PostgreSQL ne sait pas retirer une valeur d'enum en
  place : recréation du type via `_new`).
- La conversion `VIREMENT → CB` est irréversible : un ancien « virement » devient
  un « CB » dans l'historique. Acceptable car les deux sont équivalents pour le
  coach.
- La migration doit être appliquée à la base **avant** de déployer le code
  correspondant (le client Prisma ne connaît plus `VIREMENT`).
