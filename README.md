# CRM-BB — l'outil d'un coach sportif indépendant

Application web pour un coach sportif (boxe) qui gère ses propres élèves en dehors de la salle
où il travaille : planning des séances, fiches élèves, encaissements, et un **espace élève** où
ses élèves réservent eux-mêmes les cours collectifs.

Elle remplace le calendrier du téléphone et les échanges de messages par un seul outil,
pensé d'abord pour le mobile.

---

## Fonctionnalités

### Côté coach

- **Planning** : séances privées ou collectives, vue jour / semaine, statut (planifiée,
  réalisée, annulée), duplication à la semaine suivante.
- **Cours collectifs** : nombre de places (4 par défaut), création sans élève, remplissage
  affiché (« 3 / 4 »).
- **Élèves** : fiches avec coordonnées et notes privées, recherche, archivage.
- **Validation des inscriptions** : les élèves qui créent un compte arrivent dans une section
  « À valider » ; si l'email correspond à une fiche existante, le coach voit l'identité saisie
  à côté de celle de la fiche avant de valider.
- **Règlements** : chaque participation est « à régler », « payée » (espèces / carte) ou
  couverte par un pack de séances.
- **Finances** : total encaissé, répartition privé / collectif / packs, évolution sur la
  période, impayés.

### Côté élève

- **Inscription et connexion** (email + mot de passe). Le compte reste **en attente** jusqu'à
  la validation par le coach.
- **Profil** : coordonnées modifiables (email, téléphone, adresse).
- **Réserver** : les cours collectifs des 4 prochaines semaines, avec les places restantes.
  Deux élèves qui visent la dernière place au même moment ne peuvent pas la prendre tous
  les deux.
- **Mes cours** : tous ses cours, privés et collectifs, à venir et passés, avec leur statut
  de règlement. Désinscription possible jusqu'à 24 h avant un cours collectif.

---

## Stack

| Domaine          | Choix                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions)               |
| Langage          | TypeScript                                                                                     |
| Authentification | [Auth.js v5](https://authjs.dev) — Credentials, sessions JWT, rôles coach / élève              |
| Base de données  | PostgreSQL ([Neon](https://neon.tech)) via [Prisma 7](https://www.prisma.io) (adaptateur `pg`) |
| Validation       | [Zod 4](https://zod.dev)                                                                       |
| Interface        | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com), Recharts, Motion                           |
| Tests            | [Vitest](https://vitest.dev)                                                                   |
| Hébergement      | Vercel                                                                                         |

---

## Architecture

```
app/                 Pages (App Router)
  page.tsx           Accueil du coach
  planning/          Séances (coach)
  eleves/            Fiches élèves et validation des comptes (coach)
  finances/          Tableau de bord financier (coach)
  espace/            Espace élève : profil, réserver, mes cours, attente
  login/ inscription/  Pages publiques
lib/                 Logique métier, par domaine (auth, eleves, planning, finances, espace)
components/          Composants partagés (coquille de navigation, UI shadcn)
prisma/              Schéma et migrations
proxy.ts             Contrôle d'accès en amont des pages (ex-middleware)
docs/                Specs, plans, décisions d'architecture (ADR), journal
```

Principes suivis dans tout le code :

- **Lecture dans les Server Components, écriture par Server Actions**, chaque action validée
  par un schéma Zod.
- **La logique métier est isolée dans des fonctions pures** de `lib/` (règles de réservation,
  calculs de dates, décisions d'accès…) et couverte par des tests unitaires.
- **Accès contrôlé à deux niveaux** : le proxy redirige selon le rôle de la session, et chaque
  page ou action revérifie le rôle côté serveur (`requireCoach`, `requireEleve`). Un élève
  n'agit que sur ses propres données.
- **Pas de surréservation** : la réservation d'un cours se fait dans une transaction avec
  verrou de ligne (`SELECT … FOR UPDATE`).

---

## Démarrer en local

Prérequis : Node.js 20 ou plus récent, et une base PostgreSQL (une branche Neon gratuite
convient).

```bash
npm install                 # installe les dépendances et génère le client Prisma
cp .env.example .env        # puis renseigner les variables ci-dessous
npx prisma migrate deploy   # crée les tables
npm run seed                # crée le compte coach (COACH_EMAIL / COACH_PASSWORD)
npm run dev                 # http://localhost:3000
```

| Variable                        | Rôle                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Chaîne de connexion PostgreSQL                                                         |
| `AUTH_SECRET`                   | Clé de signature des sessions (`npx auth secret` ou 32 octets aléatoires en base64)    |
| `COACH_EMAIL`, `COACH_PASSWORD` | Identifiants du compte coach créé par `npm run seed`                                   |
| `AUTH_TRUST_HOST`               | `true` derrière un proxy (Vercel)                                                      |
| `TZ`                            | Fuseau horaire des séances, par ex. `Europe/Paris`                                     |
| `PROD_DATABASE_URL_HOST`        | Hôte de la base de production : les scripts de vérification refusent de tourner dessus |

> Utiliser **une base de développement distincte** de la production : les migrations et les
> scripts de test écrivent dans la base pointée par `DATABASE_URL`.

---

## Scripts

| Commande                                           | Effet                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                      | Serveur de développement                                                                                                  |
| `npm run build` / `npm start`                      | Build et serveur de production                                                                                            |
| `npm run test:run`                                 | Tests unitaires (une passe) — `npm test` en mode surveillance                                                             |
| `npm run lint`                                     | ESLint                                                                                                                    |
| `npm run format`                                   | Prettier                                                                                                                  |
| `npm run seed`                                     | Crée ou met à jour le compte coach                                                                                        |
| `npx tsx scripts/verif-reservation-concurrente.ts` | Vérifie qu'une dernière place réservée simultanément par deux élèves n'est attribuée qu'une fois (base de dev uniquement) |
| `npx prisma studio`                                | Explorer la base                                                                                                          |

---

## Déploiement

L'application est déployée sur **Vercel**, avec la base sur **Neon**. Un merge sur `main`
déclenche le déploiement.

Les migrations Prisma ne sont **pas** appliquées par le build : quand une PR en contient,
elles sont appliquées à la base de production avec `npx prisma migrate deploy` **avant** le
merge, pour que le code déployé trouve les colonnes qu'il attend.

---

## Méthode et documentation

Chaque évolution passe par une branche, des commits détaillés et une pull request. Le
dossier `docs/` garde la trace du raisonnement :

- [`docs/superpowers/specs/`](docs/superpowers/specs/) — le besoin et les choix de conception
  de chaque fonctionnalité ;
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — les plans d'implémentation, tâche par
  tâche ;
- [`docs/historique/adr/`](docs/historique/adr/) — les décisions d'architecture (rôles et
  gardes d'accès, comptes élèves, réservation…) avec les alternatives écartées ;
- [`docs/historique/CHANGELOG.md`](docs/historique/CHANGELOG.md) — le journal des versions.

---

## Feuille de route

- Connexion Google pour les élèves.
- Paiement en ligne des cours (Stripe ou virement par QR code) — à définir avec le coach.
- Rappels avant les séances.
