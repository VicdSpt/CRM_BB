# Journal de bord — CRM-BB

## 2026-06-20 — Design 6 : Restyle Finances (fin de la refonte)

- Total encaissé mis en avant ; répartition (privé / collectif / packs) en barres de proportion.
- Impayés avec pastilles ; filtres de période en corail. La refonte du design est terminée.

## 2026-06-20 — Design 5 : Restyle Planning

- Séances en cartes codées couleur par type (privé / collectif) ; badges de statut colorés.
- Navigation jour/semaine avec icônes ; fiche séance restylée (type + statut, carte d'infos).

## 2026-06-20 — Design 4 : Restyle Élèves

- Liste des élèves en cartes avec pastilles d'initiales ; recherche avec icône.
- Fiche élève restylée : en-tête avec pastille, carte d'infos, packs avec jauge de séances restantes.

## 2026-06-20 — Design 3 : Tableau de bord d'accueil

- Accueil refondu : séances du jour (prochain cours en avant), raccourcis, aperçu finances (encaissé du mois / impayés).
- Doublon de déconnexion retiré de l'accueil (présent dans la coquille de navigation).

## 2026-06-20 — Design 2 : Coquille de navigation

- Navigation persistante : onglets en bas (mobile) + barre latérale (PC) + barre du haut.
- Section active en corail ; bascule de thème et déconnexion intégrées ; page de connexion hors coquille.

## 2026-06-20 — Design 1 : Système de design + mode sombre

- Accent corail, neutres chauds, police Geist appliquée (jetons CSS).
- Mode sombre (next-themes) : suit le système, bascule mémorisée — ADR 0010.

## 2026-06-20 — Phase 5c : Tableau de bord finances

- Page Finances : revenus par période (jour/semaine/mois/année) par date d'encaissement, filtre par méthode.
- Répartition privé / collectif / packs ; liste des impayés par élève.
- Sommes calculées en SQL (Decimal exact) ; prix de séance fiabilisé en chaîne décimale — ADR 0009.

## 2026-06-19 — Phase 5b : Packs

- Création de packs prépayés sur la fiche élève (= un paiement à l'achat) ; suivi des séances restantes.
- Régler une participation avec un pack : décompte automatique du pack le plus ancien (ADR 0008) ; annulation re-crédite.
- Montants saisis validés en chaîne décimale (Decimal sans flottant) ; durcissement du double-clic de paiement (P2002).

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
