# Espace élève V1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir CRM-BB aux élèves : inscription publique validée par le coach, réservation des cours collectifs (capacité, désinscription jusqu'à 24 h avant), profil élève — sans rien casser côté coach.

**Architecture:** Un compte élève est la fiche `Eleve` enrichie (mot de passe, statut de compte). Le rôle (`coach` | `eleve`) est porté par le JWT Auth.js ; une fonction pure `routeAutorisee` décide des redirections dans le proxy, et les gardes serveur `requireCoach` / `requireEleve` revérifient le rôle (et, pour l'élève, le statut en base) dans chaque page et Server Action. L'espace élève vit sous `/espace`, l'inscription sous `/inscription`.

**Tech Stack:** Next.js 16.3 (App Router, `proxy.ts`), Auth.js v5 beta (Credentials + JWT), Prisma 7 + PostgreSQL Neon (`@prisma/adapter-pg`), Zod 4, shadcn/ui (base-ui), Tailwind 4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-10-27-espace-eleve-design.md`

## Global Constraints

- Lire le guide concerné dans `node_modules/next/dist/docs/` avant d'écrire du code Next (cf. `AGENTS.md`).
- Conventions : pages en Server Components, écritures en Server Actions (`"use server"`) validées par Zod, logique pure dans `lib/` testée en TDD (Vitest, fichiers `*.test.ts` à côté du code), UI mobile-first, **textes en français**.
- Capacité par défaut d'un cours collectif : **4**. Délai de désinscription : **24 h**, dans **une seule constante**. Horizon du calendrier élève : **4 semaines** (28 jours).
- Mot de passe : **8 caractères minimum**, haché avec `hashPassword` (bcrypt, `lib/auth/password.ts`).
- Emails **normalisés en minuscules** à chaque écriture et à chaque recherche.
- Les notes du coach (`Eleve.notes`) ne sont **jamais** lues par une page ou action élève.
- Toute action élève agit **uniquement** sur l'élève de la session, jamais sur un `eleveId` reçu du client.
- Fuseau unique (ADR 0006) : « à venir » et « 24 h avant » se calculent avec l'heure serveur.
- **Dépôt public** : aucun secret commité. Workflow : branche `feat/espace-eleve` → un commit par tâche (`type(portée): …` en français, avec la ligne `Co-Authored-By`) → push → PR → merge.
- **La base du `.env` local est la base de production** (Neon `neondb`, la même que https://crm-bb-kohl.vercel.app/). Aucune migration ni écriture de test ne s'exécute dessus : tout le développement se fait sur une **branche Neon de dev** (Task 0).
- Ne pas toucher aux packs (`Pack`, `appliquerPack`, …) ni aux règlements existants.

## Review Focus

1. **Session émise avant le déploiement (JWT sans `role`)** : le coach déjà connecté ne doit ni être pris pour un élève ni boucler ; il est traité comme déconnecté et renvoyé vers `/login`. → test dans Task 2.
2. **Élève refusé ou archivé pendant qu'il est connecté** : il doit atterrir sur `/espace/attente` avec « compte inactif » et un bouton de déconnexion, sans boucle de redirection. → test dans Task 2 (`etatAccesEleve`).
3. **Casse des emails** : `Sam@Exemple.be` à l'inscription doit se rattacher à la fiche `sam@exemple.be`, et la connexion doit marcher quelle que soit la casse saisie. → tests dans Task 2 et Task 5.
4. **Dernière place réservée en même temps par deux élèves** : un seul réussit, l'autre reçoit « Ce cours est complet ». → vérification scriptée dans Task 7.
5. **Capacité baissée sous le nombre d'inscrits par le coach** : l'élève voit « Complet », jamais un nombre de places négatif. → test dans Task 7 (`placesRestantes`).

---

## File Structure

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` + `prisma/migrations/<ts>_espace_eleve/migration.sql` | Enum `StatutCompte`, champs `Eleve.adresse/motDePasse/statutCompte/creeParInscription`, `Eleve.email` unique, `Seance.capacite` |
| `lib/auth/roles.ts` (+ test) | Type `Role`, fonction pure `routeAutorisee` utilisée par le proxy |
| `lib/auth/credentials.ts` (+ test) | `authenticate` : coach puis élève |
| `types/next-auth.d.ts` | Augmentation de types Session/JWT (`id`, `role`) |
| `auth.config.ts`, `auth.ts` | Callbacks `jwt`/`session`/`authorized`, provider Credentials élargi |
| `lib/auth/require-coach.ts` | Garde coach vérifiant le rôle |
| `lib/auth/require-eleve.ts` (+ `lib/auth/acces-eleve.ts` + test) | Garde élève + décision pure d'accès selon le statut |
| `lib/planning/schema.ts`, `lib/planning/actions.ts`, `app/planning/**` | Capacité, cours collectif vide, remplissage |
| `lib/eleves/schema.ts`, `lib/eleves/actions.ts`, `app/eleves/**` | Adresse, email unique, section « À valider », valider/refuser |
| `lib/eleves/inscription.ts` (+ test), `lib/eleves/inscription-actions.ts`, `app/inscription/**` | Inscription publique |
| `components/app-shell.tsx`, `components/eleve-shell.tsx` | Coquille élève (onglets Cours / Profil) |
| `lib/espace/regles.ts` (+ test), `lib/espace/queries.ts`, `lib/espace/actions.ts` | Règles de réservation, lecture du calendrier, réserver/annuler/profil |
| `app/espace/page.tsx`, `app/espace/attente/page.tsx`, `app/espace/profil/**` | Pages élève |
| `docs/historique/adr/0012…0014`, `docs/historique/CHANGELOG.md` | Décisions et historique |

---

### Task 0: Base de développement isolée (prérequis, action de Victor)

**Files:** aucun fichier versionné (`.env` reste hors git).

- [ ] **Step 1: Créer une branche Neon de dev** — Victor, dans la console Neon du projet : *Branches → Create branch* `dev` à partir de `main`. Récupérer sa chaîne de connexion.
- [ ] **Step 2: Pointer le local sur la branche de dev** — dans `.env` local, remplacer `DATABASE_URL` par la chaîne de la branche `dev` (garder l'ancienne en commentaire pour la mise en production).
- [ ] **Step 3: Vérifier** — Run: `npx prisma migrate status` → Expected: l'hôte affiché **n'est pas** celui de la production et « Database schema is up to date! ».

### Task 1: Schéma et migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_espace_eleve/migration.sql` (généré puis complété)

**Interfaces:**
- Produces: enum `StatutCompte { AUCUN EN_ATTENTE VALIDE }` ; `Eleve.adresse String?`, `Eleve.motDePasse String?`, `Eleve.statutCompte StatutCompte @default(AUCUN)`, `Eleve.creeParInscription Boolean @default(false)`, `Eleve.email String? @unique` ; `Seance.capacite Int @default(4)`.

- [ ] **Step 1: Modifier `prisma/schema.prisma`** avec exactement les champs ci-dessus.
- [ ] **Step 2: Générer la migration sans l'appliquer** — Run: `npx prisma migrate dev --name espace_eleve --create-only`.
- [ ] **Step 3: Normaliser les emails existants** — ajouter en tête de `migration.sql`, **avant** la création de l'index unique : `UPDATE "Eleve" SET "email" = lower(trim("email")) WHERE "email" IS NOT NULL;`
- [ ] **Step 4: Appliquer sur la branche de dev** — Run: `npx prisma migrate dev` → Expected: migration appliquée, client régénéré.
- [ ] **Step 5: Vérifier que rien n'a cassé** — Run: `npx tsc --noEmit && npm run test:run` → Expected: 0 erreur, 76 tests verts.
- [ ] **Step 6: Commit** — `feat(db): comptes élèves et capacité des séances`

### Task 2: Rôles, connexion coach/élève et gardes (à livrer avant toute page publique)

**Files:**
- Create: `lib/auth/roles.ts`, `lib/auth/roles.test.ts`, `lib/auth/acces-eleve.ts`, `lib/auth/acces-eleve.test.ts`, `lib/auth/require-eleve.ts`, `types/next-auth.d.ts`, `docs/historique/adr/0012-roles-coach-eleve.md`
- Modify: `lib/auth/credentials.ts`, `lib/auth/credentials.test.ts`, `auth.config.ts`, `auth.ts`, `lib/auth/require-coach.ts`

**Interfaces:**
- Produces:
  - `type Role = "coach" | "eleve"` (`lib/auth/roles.ts`)
  - `routeAutorisee(pathname: string, role: Role | null): { ok: true } | { redirect: string }` — `role === null` = non connecté **ou** jeton sans rôle.
  - `authenticate(input: unknown, deps: { findCoach(email: string): Promise<CoachRecord | null>; findEleve(email: string): Promise<EleveAuthRecord | null> }): Promise<{ id: string; email: string; name: string; role: Role } | null>` avec `EleveAuthRecord = { id; email; prenom; nom; motDePasse: string | null; statutCompte: StatutCompte; archive: boolean }`.
  - `etatAccesEleve(eleve: { statutCompte: StatutCompte; archive: boolean } | null): "valide" | "en_attente" | "inactif"`
  - `requireCoach(): Promise<Session>` — inchangée pour les appelants.
  - `requireEleve(): Promise<{ session: Session; eleve: Eleve }>` — élève **validé** uniquement ; sinon `redirect("/espace/attente")`.
  - `getEleveSession(): Promise<{ session: Session; eleve: Eleve | null }>` — sans redirection (pour la page d'attente) ; redirige vers `/login` si le rôle n'est pas `eleve`.
  - `session.user.id: string`, `session.user.role: Role`.

- [ ] **Step 1: Tests de `routeAutorisee`** (`lib/auth/roles.test.ts`) :
  ```ts
  expect(routeAutorisee("/login", null)).toEqual({ ok: true });
  expect(routeAutorisee("/inscription", null)).toEqual({ ok: true });
  expect(routeAutorisee("/", null)).toEqual({ redirect: "/login" });
  expect(routeAutorisee("/espace", null)).toEqual({ redirect: "/login" });
  expect(routeAutorisee("/login", "coach")).toEqual({ redirect: "/" });
  expect(routeAutorisee("/inscription", "eleve")).toEqual({ redirect: "/espace" });
  expect(routeAutorisee("/finances", "eleve")).toEqual({ redirect: "/espace" });
  expect(routeAutorisee("/eleves/abc", "eleve")).toEqual({ redirect: "/espace" });
  expect(routeAutorisee("/espace/profil", "eleve")).toEqual({ ok: true });
  expect(routeAutorisee("/espace", "coach")).toEqual({ redirect: "/" });
  expect(routeAutorisee("/espaceX", "eleve")).toEqual({ redirect: "/espace" }); // préfixe strict
  expect(routeAutorisee("/planning", "coach")).toEqual({ ok: true });
  ```
- [ ] **Step 2: Tests de `authenticate`** (adapter `credentials.test.ts`, garder les cas coach existants en passant `{ findCoach, findEleve }`) : coach trouvé → `role: "coach"` ; aucun coach + élève `VALIDE` avec bon mot de passe → `{ id, email, name: "Prénom Nom", role: "eleve" }` ; élève `EN_ATTENTE` → **connecté aussi** (`role: "eleve"`) ; élève `AUCUN` → `null` ; élève `motDePasse: null` → `null` ; élève `archive: true` → `null` ; mauvais mot de passe → `null` ; `"Sam@Exemple.BE"` saisi → `findEleve` appelé avec `"sam@exemple.be"`.
- [ ] **Step 3: Tests de `etatAccesEleve`** : `null` → `"inactif"` ; `{AUCUN,false}` → `"inactif"` ; `{VALIDE,true}` → `"inactif"` ; `{EN_ATTENTE,false}` → `"en_attente"` ; `{VALIDE,false}` → `"valide"`.
- [ ] **Step 4: Lancer** — Run: `npx vitest run lib/auth` → Expected: FAIL (fonctions absentes).
- [ ] **Step 5: Implémenter** `roles.ts`, `acces-eleve.ts`, `authenticate` (remplace `authenticateCoach` ; `credentialsSchema` met l'email en minuscules via `.trim().toLowerCase()` avant `.email()`).
- [ ] **Step 6: Câbler Auth.js** — `types/next-auth.d.ts` (augmenter `User.role`, `Session.user.{id, role}`, `JWT.{id, role}` — vérifier le nom de module JWT dans `node_modules/next-auth`). Dans `auth.config.ts` (edge-safe, pas de Prisma) : callbacks `jwt` (copie `user.id`/`user.role` dans le token à la connexion), `session` (copie vers `session.user`), `authorized` → appelle `routeAutorisee(pathname, auth?.user?.role ?? null)` et renvoie `true` ou `Response.redirect(new URL(redirect, request.nextUrl))`. Dans `auth.ts`, `authorize` appelle `authenticate` avec `prisma.coach.findUnique` et `prisma.eleve.findUnique({ where: { email } })`.
- [ ] **Step 7: Gardes serveur** — `requireCoach` : pas de session ou `role` absent → `redirect("/login")` ; `role === "eleve"` → `redirect("/espace")`. `require-eleve.ts` : charge l'élève par `session.user.id`, applique `etatAccesEleve`.
- [ ] **Step 8: Vérifier** — Run: `npx tsc --noEmit && npm run lint && npm run test:run` → Expected: tout vert.
- [ ] **Step 9: Vérification manuelle** — `npm run dev`, se connecter en coach : `/`, `/eleves`, `/planning`, `/finances` fonctionnent comme avant ; `/espace` redirige vers `/`.
- [ ] **Step 10: ADR 0012** (format `TEMPLATE.md`) : rôles dans le JWT, `routeAutorisee` dans le proxy + gardes serveur, statut élève relu en base, jetons sans rôle traités comme déconnectés.
- [ ] **Step 11: Commit** — `feat(auth): rôles coach/élève et gardes d'accès`

### Task 3: Séances — capacité et cours collectif sans élève

**Files:**
- Modify: `lib/planning/schema.ts`, `lib/planning/schema.test.ts`, `lib/planning/actions.ts`, `app/planning/seance-form.tsx`, `app/planning/nouvelle/page.tsx`, `app/planning/[id]/modifier/page.tsx`, `app/planning/[id]/page.tsx`, `app/planning/page.tsx`

**Interfaces:**
- Consumes: `Seance.capacite`, `StatutCompte` (Task 1).
- Produces: `SeanceInput.capacite: number`.

- [ ] **Step 1: Tests** (`schema.test.ts`) : `COLLECTIF` avec `eleveIds: []` → succès ; `PRIVE` avec `[]` → erreur `eleveIds` « Un cours privé doit avoir exactement un élève » ; `capacite: ""` → `4` ; `capacite: "6"` → `6` ; `capacite: "0"` → erreur `capacite` « Au moins 1 place ».
- [ ] **Step 2: Lancer** — Run: `npx vitest run lib/planning/schema.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implémenter** — `eleveIds: z.array(...)` sans `.min(1)` ; refine PRIVE inchangée ; `capacite` : chaîne vide → 4, sinon entier ≥ 1. `parseSeanceForm` lit `capacite`.
- [ ] **Step 4: Lancer** — Expected: PASS.
- [ ] **Step 5: Câbler** — `createSeance`/`updateSeance` enregistrent `capacite` ; `dupliquerSeance` copie `capacite`. `SeanceForm` : champ « Places » (number, défaut 4, affiché seulement pour `COLLECTIF`) ; sous la liste d'élèves, un avertissement « Au-delà de la capacité (n / c) » si plus de cases cochées que de places. Listes d'élèves des pages `nouvelle` et `modifier` : filtrer `statutCompte: { not: "EN_ATTENTE" }` en plus du filtre existant. Fiche séance et planning : afficher « n / capacite » pour un cours collectif.
- [ ] **Step 6: Vérifier** — `npx tsc --noEmit && npm run test:run` vert ; manuel : créer un cours collectif sans élève, le voir dans le planning avec « 0 / 4 ».
- [ ] **Step 7: Commit** — `feat(planning): capacité des cours collectifs`

### Task 4: Côté coach — adresse, email unique, élèves à valider

**Files:**
- Modify: `lib/eleves/schema.ts`, `lib/eleves/schema.test.ts`, `lib/eleves/actions.ts`, `app/eleves/eleve-form.tsx`, `app/eleves/page.tsx`, `app/eleves/[id]/page.tsx`
- Create: `app/eleves/a-valider.tsx`

**Interfaces:**
- Produces: `validerCompte(id: string): Promise<void>`, `refuserCompte(id: string): Promise<void>` (Server Actions, `requireCoach`).

- [ ] **Step 1: Tests** (`schema.test.ts`) : `adresse: "  "` → `undefined` ; `adresse: "Rue X 1"` conservée ; `email: " Sam@Exemple.BE "` → `"sam@exemple.be"`.
- [ ] **Step 2: Lancer** → FAIL. **Step 3: Implémenter** dans `eleveSchema`/`parseEleveForm`. **Step 4: Lancer** → PASS.
- [ ] **Step 5: Email déjà pris** — `createEleve`/`updateEleve` interceptent l'erreur Prisma `P2002` et renvoient `{ errors: { email: "Cet email est déjà utilisé par un autre élève." } }`.
- [ ] **Step 6: Valider / refuser** — `validerCompte` : `statutCompte = VALIDE`. `refuserCompte` : si `creeParInscription` → `prisma.eleve.delete` ; sinon → `motDePasse = null`, `statutCompte = AUCUN` (fiche intacte). Les deux font `revalidatePath("/eleves")`.
- [ ] **Step 7: UI** — `app/eleves/page.tsx` : section « À valider (n) » en tête (élèves `EN_ATTENTE`), carte avec nom, email, téléphone, mention « Correspond à une fiche existante » si `!creeParInscription`, boutons Valider / Refuser (Refuser via la modale de confirmation existante `components/bouton-suppression.tsx` ou équivalent). Les onglets Actifs/Archivés excluent les `EN_ATTENTE`. Formulaire et fiche élève : champ et affichage « Adresse ».
- [ ] **Step 8: Vérifier** — tsc + tests verts ; manuel : modifier l'adresse d'un élève ; mettre à un élève l'email d'un autre → message d'erreur.
- [ ] **Step 9: Commit** — `feat(eleves): adresse et validation des comptes élèves`

### Task 5: Inscription publique

**Files:**
- Create: `lib/eleves/inscription.ts`, `lib/eleves/inscription.test.ts`, `lib/eleves/inscription-actions.ts`, `app/inscription/page.tsx`, `app/inscription/inscription-form.tsx`, `docs/historique/adr/0013-inscription-eleves-sur-fiche.md`
- Modify: `app/login/page.tsx` (lien « Créer un compte élève »), `components/app-shell.tsx` (`/inscription` hors coquille comme `/login`)

**Interfaces:**
- Consumes: `hashPassword`, `signIn` (`@/auth`).
- Produces:
  - `inscriptionSchema` (prenom, nom, email minuscule, telephone **obligatoire**, motDePasse ≥ 8) et `parseInscriptionForm(formData): ParseResult`.
  - `decideInscription(existant: { id: string; statutCompte: StatutCompte } | null, emailEstCoach: boolean): { type: "creer" } | { type: "rattacher"; eleveId: string } | { type: "refus"; message: string }`
  - `inscrireEleve(prev: InscriptionState, formData: FormData): Promise<InscriptionState>` avec `InscriptionState = { errors?: Record<string, string>; message?: string }`.

- [ ] **Step 1: Tests** : `decideInscription(null, false)` → `{ type: "creer" }` ; `({id:"e1", statutCompte:"AUCUN"}, false)` → `{ type: "rattacher", eleveId: "e1" }` ; `EN_ATTENTE` ou `VALIDE` → `{ type: "refus", message: "Un compte existe déjà avec cet email." }` ; `(null, true)` → même refus. `parseInscriptionForm` : mot de passe de 7 caractères → erreur `motDePasse` « 8 caractères minimum » ; téléphone vide → erreur `telephone` ; email `"Sam@Exemple.be"` → `"sam@exemple.be"`.
- [ ] **Step 2: Lancer** → FAIL. **Step 3: Implémenter** `inscription.ts`. **Step 4: Lancer** → PASS.
- [ ] **Step 5: Action `inscrireEleve`** — parse ; cherche l'élève et le coach par email ; `decideInscription` ; `creer` → `prisma.eleve.create` avec `statutCompte: EN_ATTENTE`, `creeParInscription: true`, mot de passe haché ; `rattacher` → `update` du mot de passe + `statutCompte: EN_ATTENTE`, et `telephone` seulement si la fiche n'en a pas (prénom/nom de la fiche conservés) ; puis `signIn("credentials", { email, password, redirectTo: "/espace/attente" })` (relancer l'erreur de redirection comme dans `app/login/actions.ts`).
- [ ] **Step 6: Page** `/inscription` — même carte que `/login`, champs Prénom, Nom, Email, Téléphone, Mot de passe, bouton « Créer mon compte », lien « Déjà inscrit ? Se connecter ». `/login` reçoit le lien inverse.
- [ ] **Step 7: Vérifier** — tsc + tests ; manuel : s'inscrire → arrivée sur l'attente ; côté coach la carte apparaît ; s'inscrire avec l'email d'une fiche existante → carte « Correspond à une fiche existante ».
- [ ] **Step 8: ADR 0013** : comptes élèves portés par `Eleve`, inscription publique qui revient sur l'ADR 0004, validation par le coach comme protection (pas de limitation de débit en V1, à réévaluer si abus).
- [ ] **Step 9: Commit** — `feat(inscription): inscription publique des élèves`

### Task 6: Coquille élève et page d'attente

**Files:**
- Create: `components/eleve-shell.tsx`, `app/espace/attente/page.tsx`
- Modify: `components/app-shell.tsx`

**Interfaces:**
- Consumes: `getEleveSession`, `etatAccesEleve` (Task 2), `deconnexion` (`app/actions/session.ts`).
- Produces: `EleveShell({ children, onglets }: { children: ReactNode; onglets: boolean })`.

- [ ] **Step 1: `AppShell`** — pour `pathname` commençant par `/espace` (préfixe strict, via `isActive(pathname, "/espace")`), rendre `EleveShell` ; onglets masqués sur `/espace/attente`.
- [ ] **Step 2: `EleveShell`** — même structure que la coquille coach (barre du haut mobile avec thème + déconnexion, sidebar PC), deux onglets : Cours `/espace` (icône `CalendarDays`), Profil `/espace/profil` (icône `User`).
- [ ] **Step 3: Page d'attente** — `getEleveSession()` ; `valide` → `redirect("/espace")` ; `en_attente` → « Ton compte attend la validation du coach » + « Tu auras accès aux cours dès qu'il aura validé ton inscription. » ; `inactif` → « Ton compte n'est pas actif. Contacte ton coach. » ; bouton Se déconnecter dans les deux cas.
- [ ] **Step 4: Vérifier** — manuel : compte en attente → page d'attente, aucune autre page `/espace` accessible ; refuser ce compte côté coach puis recharger → « compte inactif », pas de boucle.
- [ ] **Step 5: Commit** — `feat(espace): coquille élève et page d'attente`

### Task 7: Calendrier des cours et réservation

**Files:**
- Create: `lib/espace/regles.ts`, `lib/espace/regles.test.ts`, `lib/espace/queries.ts`, `lib/espace/reservation.ts`, `lib/espace/actions.ts`, `app/espace/page.tsx`, `app/espace/carte-cours.tsx`, `scripts/verif-reservation-concurrente.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `requireEleve` (Task 2), `Seance.capacite` (Task 1), helpers de format `lib/planning/format.ts` et `formatEuros` (`lib/finances/format.ts`).
- Produces:
  - `DELAI_DESINSCRIPTION_HEURES = 24`, `HORIZON_JOURS = 28`
  - `placesRestantes(nbInscrits: number, capacite: number): number` (jamais < 0)
  - `etatCours(c: { statut: StatutSeance; debut: Date; nbInscrits: number; capacite: number; inscrit: boolean; statutReglement: StatutReglement | null }, now: Date): "annule" | "inscrit" | "inscrit_verrouille" | "complet" | "disponible" | "passe"`
  - `peutSInscrire(c, now): { ok: true } | { ok: false; raison: string }`
  - `peutSeDesinscrire(c, now): { ok: true } | { ok: false; raison: string }`
  - `coursAVenir(eleveId: string, now: Date): Promise<CoursEleve[]>` avec `CoursEleve = { id; debut: Date; dureeMinutes; lieu: string | null; prix: string; capacite; nbInscrits; statut; inscrit: boolean; statutReglement: StatutReglement | null }`
  - `reserverDansTransaction(seanceId: string, eleveId: string, now: Date): Promise<{ erreur?: string }>` (`lib/espace/reservation.ts`, sans garde, réutilisée par l'action et le script)
  - Server Actions `reserverCours(seanceId: string): Promise<{ erreur?: string }>`, `annulerReservation(seanceId: string): Promise<{ erreur?: string }>`

- [ ] **Step 1: Tests** (`regles.test.ts`, `now = new Date(2026, 10, 2, 12, 0)`) :
  - `placesRestantes(2, 4)` → `2` ; `placesRestantes(5, 4)` → `0`.
  - `etatCours` : `ANNULEE` + inscrit → `"annule"` ; disponible 2/4 → `"disponible"` ; 4/4 non inscrit → `"complet"` ; 5/4 → `"complet"` ; inscrit, début dans 25 h → `"inscrit"` ; inscrit, début dans 23 h → `"inscrit_verrouille"` ; début passé → `"passe"`.
  - `peutSInscrire` : complet → `{ ok: false, raison: "Ce cours est complet." }` ; commencé → `{ ok: false, raison: "Ce cours a déjà commencé." }` ; annulé → `{ ok: false, raison: "Ce cours est annulé." }` ; déjà inscrit → `{ ok: false, raison: "Tu es déjà inscrit à ce cours." }`.
  - `peutSeDesinscrire` : dans 23 h → `{ ok: false, raison: "Désinscription impossible à moins de 24 h du cours. Contacte ton coach." }` ; dans 25 h et `A_REGLER` → `{ ok: true }` ; dans 25 h et `PAYE` → `{ ok: false, raison: "Ce cours est déjà réglé. Contacte ton coach." }`.
- [ ] **Step 2: Lancer** → FAIL. **Step 3: Implémenter** `regles.ts`. **Step 4: Lancer** → PASS.
- [ ] **Step 5: `coursAVenir`** — séances `COLLECTIF` avec `dateHeureDebut` entre `now` et `now + HORIZON_JOURS`, statut `PLANIFIEE`, **plus** les `ANNULEE` où l'élève a une participation ; `_count.participations` ; la participation de l'élève seulement (`where: { eleveId }`) ; ne sélectionne **aucun** autre élève.
- [ ] **Step 6: `reserverDansTransaction`** — `prisma.$transaction(async (tx) => { … })` : `tx.$queryRaw\`SELECT id FROM "Seance" WHERE id = ${seanceId} FOR UPDATE\`` ; relire la séance et compter ses participations ; refuser toute séance absente ou non `COLLECTIF` (« Cours introuvable. ») ; `peutSInscrire` ; créer la `Participation` (`montant: seance.prixReference`, statut par défaut `A_REGLER`). `reserverCours` = `requireEleve()` puis `reserverDansTransaction(seanceId, eleve.id, new Date())` puis `revalidatePath("/espace")`.
- [ ] **Step 7: `annulerReservation`** — `requireEleve()` ; charger la participation `(seanceId, eleve.id)` ; `peutSeDesinscrire` ; `delete`. `revalidatePath("/espace")`.
- [ ] **Step 8: Page `/espace`** — `requireEleve()`, `coursAVenir`, groupement par jour (réutiliser les helpers de `lib/planning/dates.ts`/`format.ts`), `CarteCours` client : heure · durée, lieu · prix, pastille selon `etatCours` (« n / c places », « Complet », « Inscrit ✓ », « Annulé »), bouton M'inscrire / Me désinscrire, message d'erreur renvoyé par l'action. État vide : « Aucun cours collectif prévu pour le moment. »
- [ ] **Step 9: Vérification de concurrence** — `scripts/verif-reservation-concurrente.ts` (exécuté avec `npx tsx`, **base de dev uniquement** : le script refuse de tourner si `PROD_DATABASE_URL_HOST` est vide ou si `DATABASE_URL` **contient** cet hôte ; ajouter `PROD_DATABASE_URL_HOST=` (vide, commenté) à `.env.example` dans ce même commit, et la vraie valeur dans `.env` local) : crée une séance collective `capacite: 1` et deux élèves validés, lance en `Promise.all` `reserverDansTransaction` pour les deux, compte, puis nettoie ce qu'il a créé. Run: `npx tsx scripts/verif-reservation-concurrente.ts` → Expected: « 1 participation, 1 refus : Ce cours est complet. ».
- [ ] **Step 10: Vérifier** — tsc + lint + tests ; manuel avec un élève validé : s'inscrire, voir « 1 / 4 » côté coach, se désinscrire ; un cours à moins de 24 h n'offre plus la désinscription.
- [ ] **Step 11: Commit** — `feat(espace): réservation des cours collectifs`

### Task 8: Profil élève

**Files:**
- Create: `lib/espace/profil.ts`, `lib/espace/profil.test.ts`, `app/espace/profil/page.tsx`, `app/espace/profil/profil-form.tsx`
- Modify: `lib/espace/actions.ts`

**Interfaces:**
- Produces: `profilSchema` (email minuscule obligatoire, telephone obligatoire, adresse optionnelle), `parseProfilForm(formData): ParseResult` ; `verifierEmailLibre(email: string, ctx: { eleveIdCourant: string; eleveAvecEmail: { id: string } | null; emailEstCoach: boolean }): string | null` (message d'erreur ou `null`) ; Server Action `updateProfil(prev: ProfilState, formData: FormData): Promise<ProfilState>`.

- [ ] **Step 1: Tests** : `verifierEmailLibre` → `null` si l'email appartient à l'élève courant ou à personne ; « Cet email est déjà utilisé. » s'il appartient à un autre élève ou au coach. `parseProfilForm` : adresse vide → `undefined` ; email mis en minuscules ; téléphone vide → erreur.
- [ ] **Step 2: Lancer** → FAIL. **Step 3: Implémenter**. **Step 4: Lancer** → PASS.
- [ ] **Step 5: Action et page** — `updateProfil` : `requireEleve()`, parse, `verifierEmailLibre`, `prisma.eleve.update({ where: { id: eleve.id }, data: { email, telephone, adresse } })` (jamais `notes`, `prenom`, `nom`), message « Profil enregistré. ». Page : prénom + nom en lecture seule, trois champs, bouton Enregistrer. Le JWT garde l'ancien email : sans incidence (l'id fait foi), la connexion suivante utilise le nouvel email.
- [ ] **Step 6: Vérifier** — tsc + tests ; manuel : modifier l'adresse, se déconnecter, se reconnecter avec le nouvel email.
- [ ] **Step 7: Commit** — `feat(espace): profil élève`

### Task 9: Documentation, vérification finale et mise en production

**Files:**
- Create: `docs/historique/adr/0014-capacite-et-reservation-eleve.md`
- Modify: `docs/historique/CHANGELOG.md`

- [ ] **Step 1: ADR 0014** — capacité (défaut 4, dépassable par le coach seulement), verrou `FOR UPDATE`, délai 24 h dans une constante, packs ignorés par la réservation élève.
- [ ] **Step 2: CHANGELOG** — entrée « Espace élève V1 » listant les fonctionnalités.
- [ ] **Step 3: Vérification complète** — Run: `npx tsc --noEmit && npm run lint && npm run test:run && npm run build` → Expected: tout vert, aucun avertissement nouveau.
- [ ] **Step 4: Parcours de bout en bout** (dev, base de dev) : inscription → attente → validation coach → réservation → désinscription → profil ; puis un élève tente `/finances`, `/eleves`, `/planning` → renvoyé vers `/espace`.
- [ ] **Step 5: Push et PR** — `git push -u origin feat/espace-eleve`, `gh pr create` (résumé, captures des écrans élève, liste des tests).
- [ ] **Step 6: Mise en production (avec Victor, après relecture de la PR)** — appliquer la migration à la base de production **avant** le merge : `DATABASE_URL=<prod> npx prisma migrate deploy` → Expected: « All migrations have been successfully applied. ». Puis merger la PR (Vercel déploie). Vérifier sur https://crm-bb-kohl.vercel.app/ : connexion coach OK, `/inscription` accessible.
