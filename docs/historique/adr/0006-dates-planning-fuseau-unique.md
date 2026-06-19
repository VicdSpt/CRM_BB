# ADR 0006 — Gestion des dates du planning (entrées locales, fuseau unique)

**Date :** 2026-06-19
**Statut :** Accepté

## Contexte

Le coach saisit des séances avec date + heure. L'outil est mono-utilisateur, utilisé
dans un seul fuseau horaire. Il faut éviter la complexité d'une gestion multi-fuseaux.

## Décision

Les dates sont saisies via `<input type="datetime-local">` (heure locale) et stockées en
`DateTime` Postgres. Les calculs de plages (jour/semaine) se font en heure locale du
serveur via des helpers purs testés (`lib/planning/dates.ts`). On suppose un fuseau unique.

## Alternatives écartées

- Stockage et affichage en UTC avec conversions explicites par fuseau : superflu pour un
  usage mono-coach mono-fuseau.
- Bibliothèque de dates (date-fns, Luxon) : non nécessaire pour ces quelques calculs ;
  on garde des helpers maison légers et testés.

## Conséquences

- Simplicité maximale tant que le coach reste dans un seul fuseau.
- Si un déploiement serveur dans un autre fuseau pose souci, fixer `TZ` côté serveur ou
  introduire une conversion explicite (à réévaluer le moment venu).
