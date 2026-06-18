# ADR 0001 — Stack Next.js full-stack

**Date :** 2026-06-18
**Statut :** Accepté

## Contexte

Besoin d'un CRM réel, robuste, moderne et sécurisé pour un coach sportif,
construit et maintenu par une seule personne (formation WCS, stack JS/React).

## Décision

Application unique Next.js (App Router, TypeScript) servant front et back,
PostgreSQL (Neon) via Prisma, Auth.js, Tailwind + shadcn/ui, déploiement Vercel.

## Alternatives écartées

- React (Vite) + API Express séparée : deux projets à câbler/déployer, plus de
  plomberie et de sécurité à gérer manuellement.
- Next.js + Supabase tout-en-un : forte dépendance à la logique propre de Supabase.

## Conséquences

- Une seule codebase, sécurité solide par défaut, déploiement simple.
- Nécessite de maîtriser le modèle App Router / Server Actions.
