# ADR 0016 — RGPD : politique de confidentialité et suppression du compte par l'élève

**Date :** 2026-10-29
**Statut :** Accepté

## Contexte

L'app conserve des données personnelles d'élèves (identité, email, téléphone, adresse, notes
du coach, historique de cours et de paiements). Le RGPD impose d'informer les personnes et de
leur permettre d'exercer leurs droits, dont l'effacement. Jusqu'ici, seul le coach pouvait
supprimer une fiche, et une fiche avec historique ne pouvait qu'être archivée (ADR 0007).

## Décision

- **Page `/confidentialite`**, ouverte à tous, connecté ou non (nouvelle catégorie « pages
  libres » dans `lib/auth/roles.ts`, sans redirection ni menu). Révisé le 2026-10-30 : texte
  en termes simples, sans nom de personne (« l'administrateur du site », qui a accès à tout ;
  le coach voit ce qui concerne les cours) ; email de contact optionnel via `CONTACT_EMAIL`,
  jamais dans le dépôt. Lien « Confidentialité » en pied de page des espaces coach et élève.
  Liens depuis la connexion, l'inscription et le profil.
- **Suppression du compte par l'élève** (`supprimerMonCompte`, profil), après avoir tapé
  « SUPPRIMER » (vérifié côté serveur), dans une transaction :
  1. ses réservations futures non payées et hors pack sont annulées (la place se libère) ;
  2. s'il ne reste ni cours, ni pack, ni paiement, la fiche est supprimée ;
  3. sinon elle est **anonymisée** : « Élève supprimé », email, téléphone, adresse, notes,
     mot de passe et identité d'inscription effacés, compte fermé et archivé.
  4. enfin, son compteur d'échecs de connexion est effacé et il est déconnecté.
- Règles pures testées dans `lib/espace/suppression-compte.ts`.

## Alternatives écartées

- **Tout supprimer** : les montants de la page Finances changeraient rétroactivement ; la
  comptabilité doit être conservée (obligation légale), sans pour autant identifier l'élève.
- **Demande traitée par le coach** : étape manuelle et délai pour un droit que l'élève peut
  exercer seul.
- **Email de confirmation à l'inscription** : écarté pour l'instant, l'inscription doit rester
  courte et la validation par le coach filtre déjà les comptes.

## Conséquences

- Les séances passées du coach peuvent afficher « Élève supprimé » ; ces fiches sont archivées.
- L'export des données (portabilité) se fait sur demande au coach, pas encore dans l'app.
- Pas de bandeau cookies : seul le cookie de session, indispensable, est utilisé.
