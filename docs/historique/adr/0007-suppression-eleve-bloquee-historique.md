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
