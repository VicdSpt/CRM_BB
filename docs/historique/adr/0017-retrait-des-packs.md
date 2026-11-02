# ADR 0017 — Retrait du système de packs

**Date :** 2026-11-02
**Statut :** Accepté (remplace ADR 0008)

## Contexte

Les packs de séances (achat de N séances, décomptées à chaque cours) n'étaient pas utilisés
dans la pratique du coach et ajoutaient un troisième état de règlement partout : fiche élève,
fiche séance, finances, espace élève. Le paiement en ligne, prochaine étape, sera plus simple
sans eux.

## Décision

- Suppression complète : table `Pack`, colonnes `packId` (Participation, Paiement), valeur
  `COUVERT_PAR_PACK` du statut de règlement, actions, écrans et graphique « Packs ».
- Une participation est désormais seulement « à régler » ou « payée » (espèces ou carte).
- Migration `20261102120000_retrait_packs` : les paiements d'achat de pack sont effacés et
  les séances couvertes par un pack repassent « à régler » (données de production fictives
  au moment de la décision).

## Alternatives écartées

- **Masquer les packs côté élève seulement** : le coach ne s'en sert pas, le code serait resté
  à maintenir.
- **Masquer partout en gardant les tables** : réactivable, mais garde un modèle de données
  inutilisé.
- **Garder l'historique des anciens packs** : sans objet, les données étaient fictives.

## Conséquences

- Modèle de règlement plus simple, finances réparties entre cours privés et collectifs.
- Revenir aux packs demanderait de recréer table, migration et écrans.
- La migration efface des paiements : à ne lancer en production qu'en connaissance de cause
  (sauvegarde avec `npm run sauvegarde` si des données réelles existent).
