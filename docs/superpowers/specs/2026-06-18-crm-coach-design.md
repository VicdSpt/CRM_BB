# CRM-BB — Outil de gestion pour coach sportif / boxe

**Date :** 2026-06-18
**Statut :** Design validé (brainstorming)
**Auteur :** Victor

---

## 1. Contexte & objectif

Outil **réel de production** (pas un projet d'apprentissage) destiné à un ami coach
sportif / boxe qui s'en servira **tous les jours**. Objectif : un CRM moderne, robuste
et fiable côté sécurité pour gérer :

- les **rendez-vous** (cours privés et collectifs),
- les **élèves**,
- les **finances** (revenus, paiements, impayés, packs).

**Utilisateur :** le coach uniquement pour le moment (mono-utilisateur). L'accès des
élèves est hors périmètre v1 mais le modèle reste extensible pour l'ajouter plus tard.

**Usage :** web responsive, **mobile-first** (utilisation en journée sur téléphone),
confortable aussi sur PC (le soir).

---

## 2. Stack technique (Approche A — Next.js full-stack)

| Domaine          | Choix                                                           |
| ---------------- | --------------------------------------------------------------- |
| Framework        | **Next.js** (App Router), **React**, **TypeScript**             |
| UI               | **Tailwind CSS** + **shadcn/ui**, mobile-first                  |
| Back-end         | Server Actions / Route Handlers Next.js (pas de serveur séparé) |
| Base de données  | **PostgreSQL** hébergée chez **Neon**                           |
| ORM              | **Prisma** (typage, migrations versionnées)                     |
| Authentification | **Auth.js (NextAuth)** — email + mot de passe                   |
| Validation       | **Zod** (validation côté serveur)                               |
| Tests            | **Vitest** (unitaires + composants)                             |
| Qualité          | ESLint + Prettier + TypeScript strict                           |
| Hébergement      | **Vercel** (HTTPS auto, déploiement sur push)                   |

Dépôt Git unique, déployable et maintenable par une seule personne.

---

## 3. Modèle de données

### Entités

**Coach** — compte de connexion (un seul pour l'instant).
`email`, `motDePasse` (chiffré), `nom`.

**Élève** — `prénom`, `nom`, `téléphone`, `email`, `notes`, `dateAjout`, `archivé`.

**Séance** — unité de planning.
`type` (PRIVE | COLLECTIF), `dateHeureDebut`, `dureeMinutes`, `lieu` (optionnel),
`prixReference`, `statut` (PLANIFIEE | REALISEE | ANNULEE).

**Participation** — lien Séance ↔ Élève (**pièce maîtresse**).
Une séance privée = 1 participation ; une séance collective = N participations.
`séanceId`, `élèveId`, `statutReglement` (A_REGLER | PAYE | COUVERT_PAR_PACK),
`packId` (optionnel, si couverte par un pack), `montant` (hérite du prix de la séance,
modifiable).

**Pack** — carnet prépayé acheté par un élève.
`élèveId`, `nbSeancesTotal`, `nbSeancesRestantes`, `montantPaye`, `dateAchat`.
Quand une participation est COUVERT_PAR_PACK, on décrémente `nbSeancesRestantes`.

**Paiement** — règlement encaissé (**source de vérité des revenus**).
`montant`, `date`, `methode` (ESPECES | CB | VIREMENT), `élèveId`,
référence vers ce qu'il règle : soit une **participation** (paiement à la séance),
soit un **pack** (achat du pack).

### Relations

- Élève 1—N Participation, 1—N Pack, 1—N Paiement
- Séance 1—N Participation
- Pack 1—N Participation (les séances décomptées) ; Pack 1—1 Paiement (l'achat)
- Participation 0/1—1 Paiement (si payée à la séance)

### Règles de calcul (finances)

- **Revenus sur une période** = somme des **Paiements** dont la `date` (date
  d'encaissement) tombe dans la période. Un achat de pack compte le jour de l'achat ;
  une séance payée compte à la date de son paiement.
- **Filtre par méthode** : possibilité de filtrer les revenus par `methode`
  (ex. « combien encaissé en espèces ce mois-ci »).
- **Qui doit payer** = Participations au statut `A_REGLER` (montant dû par élève).
- **Répartition privé/collectif** = regroupement des paiements/participations par
  `type` de séance.

---

## 4. Écrans & fonctionnalités

Navigation : barre en bas (mobile) / latérale (PC). 4 espaces.

### 4.1 🔐 Connexion

Login email + mot de passe. Tout le reste est protégé (redirection si non connecté).

### 4.2 📅 Planning (écran principal)

- Vue **agenda jour / semaine**, séances codées couleur privé/collectif. (Vue mois : évolution future.)
- Créer une séance : type, date/heure, durée, lieu, prix, puis ajout du/des élève(s).
- Sur une séance : marquer _réalisée_ / _annulée_ ; pour chaque élève, noter le
  règlement (payé cash, à régler, ou décompté d'un pack).

### 4.3 👤 Élèves

- Liste recherchable.
- Fiche élève : infos, historique de séances, packs en cours (séances restantes),
  montant dû éventuel.
- Ajouter / modifier / archiver un élève ; lui créer un pack.

### 4.4 💶 Finances

- Sélecteur de période : **jour / semaine / mois / année**.
- **Total encaissé** sur la période + **filtre par méthode** (espèces / CB / virement).
- **Répartition privé vs collectif**.
- **Impayés** : liste « qui doit payer » avec montant.
- (Suivi des packs surtout visible dans les fiches élèves.)

---

## 5. Sécurité

- **Mots de passe** chiffrés (bcrypt/argon2), jamais en clair.
- **Sessions** Auth.js : cookies `httpOnly`, sécurisés, avec expiration.
- **Protection globale** : middleware vérifiant l'authentification avant tout accès aux données.
- **Validation serveur** systématique avec **Zod** (formulaires + API).
- **Prisma** : protection native contre les injections SQL.
- **HTTPS** partout (Vercel) + en-têtes de sécurité de base.
- **Secrets** en variables d'environnement, jamais dans Git.
- **RGPD** dès le départ : minimisation des données, suppression possible d'un élève.

---

## 6. Tests

- **TDD** sur la logique métier financière (calculs de revenus, décompte de packs,
  statuts de règlement) — test d'abord, puis code.
- **Tests unitaires** (Vitest) sur cette logique critique.
- **Tests de composants** sur les formulaires clés (création de séance, paiement).
- ESLint + TypeScript strict en garde-fou permanent.
- Cible : couvrir en priorité **ce qui touche à l'argent et à la sécurité**, pas 100 % partout.

---

## 7. Workflow & traçabilité

- **Git** : une **branche par fonctionnalité** (ex. `feat/planning`), commits petits et
  clairs, **jamais de push direct sur `main`**, fusion après tests.
- **`docs/historique/`** :
  - **ADR** (Architecture Decision Records) : un fichier par décision importante
    (contexte, option choisie, alternatives écartées, pourquoi).
  - **Changelog / journal de bord** : ce qui a été fait, quand, pourquoi.
- Les specs de design vivent dans `docs/superpowers/specs/`.

---

## 8. Hors périmètre (v1)

- Accès / comptes élèves (prévu pour plus tard).
- Multi-coachs.
- Moteur de récurrence des séances (création à la carte pour l'instant ;
  raccourci « dupliquer » possible plus tard).
- Vue mois du planning.
- Notifications / rappels automatiques.
- Modèle de facturation des cours collectifs : à confirmer avec le coach
  (le modèle actuel — paiement à la séance ou pack — le couvre déjà de façon flexible).

---

## 9. Points à confirmer avec le coach (plus tard)

- Comment il facture précisément les **cours collectifs**.
- Métriques finances supplémentaires éventuelles.
