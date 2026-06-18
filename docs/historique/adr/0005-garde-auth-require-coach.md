# ADR 0005 — Garde d'authentification `requireCoach()`

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Le middleware protège déjà toutes les routes, mais chaque page/Server Action sensible
doit aussi disposer de la session (et échouer sûrement si elle manque) sans répéter la
même logique partout.

## Décision

Un helper unique `requireCoach()` (dans `lib/auth/require-coach.ts`) qui renvoie la session
ou redirige vers `/login`. Appelé en tête de chaque page et Server Action protégée.

## Alternatives écartées

- S'appuyer uniquement sur le middleware : insuffisant pour les Server Actions appelées
  directement, et ne fournit pas l'objet session à la page.
- Répéter `const session = await auth(); if (!session) redirect(...)` partout : duplication.

## Conséquences

- Une seule ligne `await requireCoach()` garde n'importe quelle page/action.
- Point central pour faire évoluer la logique d'accès (rôles élèves plus tard).
