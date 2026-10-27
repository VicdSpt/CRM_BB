# ADR 0012 — Rôles coach / élève et gardes d'accès

**Date :** 2026-10-27
**Statut :** Accepté

## Contexte

Jusqu'ici l'application n'avait qu'un utilisateur, le coach (ADR 0004). La garde
`requireCoach()` et le callback `authorized` du proxy vérifiaient seulement qu'une
session existait. L'espace élève (spec `2026-10-27-espace-eleve-design.md`) introduit des
comptes élèves : sans changement, un élève connecté aurait eu accès à toute la partie
coach (élèves, finances, notes privées).

## Décision

- Le **rôle** (`coach` | `eleve`) et l'**id** sont copiés dans le JWT à la connexion
  (callback `jwt`), puis dans la session (callback `session`).
- La connexion (`authenticate`, logique pure testée) cherche d'abord un coach, puis un
  élève ayant un compte (en attente ou validé, non archivé). Emails comparés en minuscules.
- Le proxy décide des redirections via une fonction pure testée, `routeAutorisee` :
  pages publiques `/login` et `/inscription`, espace élève sous `/espace` (préfixe
  strict), tout le reste réservé au coach.
- Défense en profondeur : `requireCoach()` vérifie le rôle coach dans chaque page et
  Server Action ; `requireEleve()` vérifie le rôle élève **et relit le statut du compte en
  base** (la validation par le coach arrive après la connexion, le JWT ne la reflète pas).
- Un jeton **sans rôle** (émis avant cette version) est traité comme déconnecté.

## Alternatives écartées

- **Statut du compte élève dans le JWT** : il serait périmé dès que le coach valide ou
  refuse le compte ; il faudrait forcer une reconnexion.
- **Deux pages de connexion séparées** : inutile, l'email suffit à distinguer les comptes.
- **Se fier au seul proxy** : les Server Actions sont appelables directement ; la garde
  serveur reste indispensable.

## Conséquences

- Le coach déjà connecté au moment du déploiement devra se reconnecter une fois.
- Une requête en base supplémentaire par page élève (lecture de la fiche), négligeable.
- Ajouter un rôle plus tard (ex. second coach) passe par `Role` et `routeAutorisee`.
