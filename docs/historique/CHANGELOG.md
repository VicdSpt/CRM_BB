# Journal de bord — CRM-BB

## 2026-06-19 — Phase 5a : Paiements

- Marquer une participation payée (espèces / CB / virement) sur la fiche séance ; annuler un paiement.
- Suppression d'un élève bloquée s'il a un historique (force l'archivage) — ADR 0007.
- Helper de formatage monétaire (€) testé (TDD).

## 2026-06-19 — Phase 4 : Planning (séances)

- Création/modification/suppression de séances (privées / collectives).
- Rattachement des élèves participants ; statut planifiée / réalisée / annulée.
- Agenda vue jour / semaine (mobile-first) avec navigation.
- Pages et Server Actions protégées par `requireCoach()` ; helpers de dates testés (TDD).

## 2026-06-18 — Phase 3 : Élèves (CRUD)

- Liste recherchable des élèves (actifs / archivés).
- Fiche élève ; création, modification.
- Archivage / désarchivage et suppression définitive (RGPD, avec confirmation).
- Pages et Server Actions protégées par `requireCoach()` (ADR 0005).

## 2026-06-18 — Phase 2 : Authentification

- Connexion email/mot de passe (Auth.js v5, Credentials, sessions JWT).
- Mots de passe hachés (bcrypt), logique d'auth isolée et testée (TDD).
- Compte coach créé via `npm run seed` depuis `.env` (pas d'inscription publique).
- Middleware protégeant toutes les routes sauf /login (split config edge-safe `auth.config.ts`) ; tableau de bord minimal + déconnexion.
- Adaptateur de driver Prisma v7 (PrismaPg + pg) — voir ADR 0003.

## 2026-06-18 — Phase 1 : Fondations

- Mise en place du squelette : Next.js + TypeScript + Tailwind + shadcn/ui.
- Prisma + PostgreSQL (Neon), schéma de données complet.
- Vitest, ESLint, Prettier.
- Structure de traçabilité (ADR + changelog).
