# ADR 0013 — Inscription publique des élèves, comptes portés par la fiche `Eleve`

**Date :** 2026-10-28
**Statut :** Accepté (revient sur l'ADR 0004 : « pas de page d'inscription »)

## Contexte

L'ADR 0004 excluait toute inscription publique : l'outil n'avait qu'un utilisateur. La
V1 de l'espace élève demande que n'importe qui puisse créer un compte, que le coach
valide ensuite. Beaucoup d'élèves ont déjà une fiche créée par le coach.

## Décision

- Un compte élève **est** la fiche `Eleve`, enrichie de `motDePasse` (optionnel),
  `statutCompte` (`AUCUN` / `EN_ATTENTE` / `VALIDE`) et `creeParInscription`.
- `Eleve.email` devient **unique**, toujours en minuscules.
- Page publique `/inscription` : prénom, nom, email, téléphone, mot de passe (8 caractères
  minimum). La décision est une fonction pure testée, `decideInscription` :
  email inconnu → nouvelle fiche ; fiche sans compte → **rattachement** (prénom/nom de la
  fiche conservés) ; compte existant ou email du coach → refus.
- Le compte créé est **en attente** ; l'élève est connecté et ne voit qu'un écran
  d'attente tant que le coach ne l'a pas validé (section « À valider » de « Élèves »).
- Refus par le coach : la fiche est supprimée si elle vient de l'inscription, sinon seules
  les infos de compte sont retirées.

## Alternatives écartées

- **Table `Utilisateur` séparée** liée à `Eleve` : doublon de coordonnées et une jointure
  de plus, sans bénéfice tant qu'il n'y a qu'un type de compte élève.
- **Toujours créer une nouvelle fiche** : doublons dans « Élèves » pour les élèves déjà
  connus du coach.
- **Limitation de débit / captcha** : non retenus en V1 ; la validation manuelle par le
  coach suffit comme protection. À réévaluer en cas d'abus.

## Conséquences

- `motDePasse` optionnel laisse la place à la connexion Google (compte sans mot de passe).
- Rattacher par email suppose que la fiche du coach porte le bon email : le coach le voit
  (« Correspond à une fiche existante ») et peut refuser.
