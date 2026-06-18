# ADR 0004 — Auth.js avec Credentials et sessions JWT

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Outil mono-utilisateur (le coach). Besoin d'une connexion sécurisée email/mot de passe,
sans inscription publique, et sans complexité de gestion de sessions en base.

## Décision

Auth.js (NextAuth v5) avec le provider Credentials et la stratégie de session JWT.
La vérification des identifiants délègue à `authenticateCoach` (logique pure, testée).
Le compte coach est créé par un script de seed depuis `.env`.

## Alternatives écartées

- Stratégie de session en base (table Session via l'adaptateur Prisma) : superflue pour
  un seul utilisateur, ajoute des tables et de la complexité.
- Provider OAuth (Google/GitHub) : inutile et lie le compte du coach à un tiers.
- Page d'inscription : risque de sécurité (création de compte ouverte) pour un outil perso.

## Conséquences

- Sessions sans état (JWT signé par AUTH_SECRET), simples et performantes.
- Le changement de mot de passe se fait en relançant le seed.
- Logique d'auth testable indépendamment de NextAuth.
