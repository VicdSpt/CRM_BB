# Espace élève — inscription, validation, réservation des cours collectifs (V1)

**Date :** 2026-10-27
**Statut :** Design validé (brainstorming)
**Auteur :** Victor

---

## 1. Contexte & objectif

CRM-BB est aujourd'hui l'outil **personnel d'un coach** (un ami de Victor) : il y gère seul ses
élèves, son planning, ses packs et ses finances. Les élèves n'ont aucun accès.

En dehors de la salle où il travaille (qui utilise **Glofox** sur le compte de la salle), le
coach gère ses propres élèves à la main, via le **calendrier de son iPhone**, et encaisse en
**liquide ou par virement**. L'objectif est que CRM-BB **centralise tout ce qui touche à son
activité de coach** — réservations, paiements, suivi — avec Glofox comme source d'inspiration.

Cette V1 ouvre l'application aux **élèves** : ils créent un compte, le coach les valide, puis
ils consultent les **cours collectifs** du coach et s'y inscrivent eux-mêmes. C'est une
première version pour **voir comment l'espace élève s'emboîte avec l'existant**, pas une
version finale.

---

## 2. Objectifs, non-objectifs, anti-objectifs

### Objectifs (V1)

1. Un élève peut **créer un compte** (email + mot de passe) et **se connecter**.
2. Un compte nouvellement créé est **en attente** : l'élève peut se connecter mais ne voit
   aucun contenu tant que le coach ne l'a pas **validé**.
3. Le nouvel inscrit apparaît chez le coach dans **« Élèves »**, avec ses coordonnées, dans une
   section **« À valider »** ; le coach le **valide** ou le **refuse**.
4. Un élève validé voit les **cours collectifs à venir** créés par le coach, avec les places
   restantes, et peut **s'inscrire** ou **se désinscrire** (jusqu'à 24 h avant le cours).
5. Un élève validé voit et modifie **son profil** : email, téléphone, adresse.
6. Le coach peut fixer le **nombre de places** d'un cours collectif (**4 par défaut**).

### Non-objectifs (V1 — prévus plus tard)

- **Connexion Google** : à ajouter **juste après la V1**, une fois l'espace élève en place,
  pour tester le rendu. La V1 ne doit rien faire qui l'empêche (voir § 4).
- **Paiement en ligne** (Stripe, QR code…) : **reporté**, à discuter encore avec le coach.
  En V1 l'élève paie comme aujourd'hui (liquide ou virement), le coach enregistre le
  règlement dans l'app comme il le fait déjà.
- **Packs côté élève** : les packs ne sont **pas pris en compte** par la réservation élève.
  Victor pense qu'ils vont disparaître ; ce sera une décision séparée. On **ne touche pas**
  aux packs existants.
- Séances **privées** côté élève : elles restent gérées par le coach seul, invisibles pour
  les élèves.
- Notifications (email, push, SMS), liste d'attente, mot de passe oublié, récurrence.
- Suppression de son compte par l'élève lui-même (le coach peut toujours supprimer ou
  archiver la fiche, comme aujourd'hui).

### Anti-objectifs (ce qui ferait de la V1 un échec même si elle « marche »)

- Un élève (validé ou non) qui peut **accéder à la moindre page ou action du coach**
  (élèves, planning coach, finances, notes privées).
- Un élève qui peut **lire les données d'un autre élève** (coordonnées, inscriptions).
- Un cours qui **dépasse sa capacité** parce que deux élèves ont réservé en même temps.
- **Casser le fonctionnement actuel du coach** (planning, règlements, packs, finances).

---

## 3. Parcours (maquettes validées)

Les maquettes en fil de fer ont été validées par Victor (mobile d'abord, comme le reste de
l'app). Écrans :

1. **Inscription** (`/inscription`, publique) : prénom, nom, email, téléphone, mot de passe.
   Lien « Déjà inscrit ? Se connecter ». L'adresse n'est **pas** demandée ici (elle se
   remplit dans le profil).
2. **En attente** : après inscription ou connexion, tant que le compte n'est pas validé,
   l'élève voit uniquement « Ton compte attend la validation du coach » et un bouton de
   déconnexion.
3. **Cours** : liste des cours collectifs à venir, groupés par jour. Chaque cours affiche
   heure, durée, lieu, prix et un état :
   - **places restantes** (« 2 / 4 places ») + bouton **M'inscrire** ;
   - **Complet** (bouton désactivé) ;
   - **Inscrit ✓** + bouton **Me désinscrire** (masqué à moins de 24 h du début).
4. **Mon profil** : prénom et nom affichés ; email, téléphone, adresse modifiables ;
   bouton Enregistrer.
5. **Côté coach — Élèves** : une section **« À valider (n) »** en tête de liste, chaque nouvel
   inscrit avec ses coordonnées et deux boutons **Valider** / **Refuser**.

Navigation élève : deux onglets **Cours** et **Profil** (barre du bas en mobile, même
principe que la coquille coach actuelle), plus la déconnexion.

---

## 4. Décisions de conception

Ce qui suit est **décidé par Victor** sauf mention *(choix de conception)* — ces derniers
sont des propositions raisonnables que le builder peut ajuster sans changer ce qui est
livré.

### 4.1 Rôles et sécurité (prioritaire)

- Deux rôles : **coach** et **élève**. Le rôle est porté par la session (JWT Auth.js,
  cf. ADR 0004) *(choix de conception)*.
- **Aujourd'hui, `requireCoach()` ne vérifie que l'existence d'une session** et la garde du
  proxy (`auth.config.ts › authorized`) laisse passer tout utilisateur connecté. Avec des
  comptes élèves, **ces deux gardes doivent vérifier le rôle coach**, sinon un élève aurait
  accès à toute la partie coach. Toutes les pages et Server Actions coach existantes
  (≈ 27 appels à `requireCoach()`) restent protégées par cette garde renforcée.
- Une garde équivalente côté élève (`requireEleve()` ou similaire) vérifie le rôle élève
  **et relit le statut du compte en base** à chaque requête : la validation par le coach
  arrive après la connexion, le JWT ne suffit donc pas pour savoir si l'élève est validé
  *(choix de conception)*.
- Toutes les actions élève opèrent **uniquement sur l'élève de la session** (jamais sur un
  identifiant d'élève reçu du formulaire).
- Routage : l'espace élève vit sous un préfixe dédié (par ex. `/espace`)
  *(choix de conception)*. Après connexion, le coach arrive sur `/` (inchangé), l'élève sur
  son espace. Un élève qui tente une URL coach est renvoyé vers son espace.
- **Une seule page de connexion** `/login` pour les deux rôles ; on cherche d'abord un
  coach puis un élève avec cet email *(choix de conception)*.

### 4.2 Modèle de données

- **Compte élève = fiche `Eleve`.** Un élève inscrit **est** une fiche élève (celle que le
  coach voit dans « Élèves »), enrichie des informations de compte. Pas de doublon entre
  « utilisateur » et « élève ».
- Nouveaux champs sur `Eleve` *(choix de conception sur les noms et types)* :
  - `adresse` (texte, optionnel) — nouveau champ visible du coach et de l'élève ;
  - `motDePasse` (haché bcrypt, comme le coach) — **optionnel**, pour que les fiches créées
    par le coach sans compte restent valides et pour laisser la place à la connexion
    Google plus tard (un compte Google n'aura pas de mot de passe) ;
  - un **statut de compte** : aucun compte / en attente / validé.
- `Eleve.email` doit devenir **unique** dès qu'il sert d'identifiant de connexion.
  Les fiches existantes peuvent ne pas avoir d'email. Vérifié le 2026-10-27 : 5 fiches,
  3 avec email, **aucun doublon** ; la contrainte d'unicité peut être ajoutée sans
  nettoyage (à revérifier juste avant la migration). La comparaison des emails se fait
  **sans tenir compte de la casse** (emails normalisés en minuscules à l'écriture)
  *(choix de conception)*.
- `Seance` gagne une **capacité** (`capacite`, entier, **défaut 4**), saisie dans le
  formulaire de séance du coach.
- Le formulaire de séance actuel **exige au moins un élève** (`seanceSchema`) : pour un
  cours **collectif**, il doit désormais être possible de le créer **vide**, puisque ce
  sont les élèves qui s'inscrivent. Un cours **privé** garde exactement un élève.
- Rien ne change pour `Pack`, `Paiement`, `Participation` (hors création par l'élève).

### 4.3 Inscription et validation

- L'inscription crée une fiche `Eleve` **en attente** avec prénom, nom, email, téléphone et
  mot de passe haché ; l'élève est connecté directement et voit l'écran d'attente
  *(choix de conception)*.
- **Fiche existante avec le même email** : beaucoup d'élèves ont déjà une fiche créée par le
  coach. Si une fiche sans compte porte déjà cet email, l'inscription **se rattache à cette
  fiche** (elle passe en attente) au lieu d'en créer une nouvelle. Comme le coach valide
  chaque inscription, il garde la main : la carte « À valider » signale « correspond à une
  fiche existante » *(choix de conception)*. Si l'email appartient déjà à un compte (en
  attente ou validé), ou à l'email du **coach**, l'inscription est refusée (« un compte
  existe déjà avec cet email »).
- **Valider** : le compte passe en validé.
- **Refuser** : si la fiche a été créée par l'inscription, elle est supprimée ; si c'était
  une fiche existante rattachée, on retire seulement les infos de compte (mot de passe,
  statut) et la fiche reste intacte *(choix de conception)*.
- Les élèves en attente **n'apparaissent pas** dans les listes de sélection du planning
  coach *(choix de conception)*.
- Les élèves **archivés** ne peuvent pas se connecter *(choix de conception)*.

### 4.4 Cours visibles et réservation

- L'élève validé voit les séances **`COLLECTIF`**, au statut **`PLANIFIEE`**, dont le début
  est **dans le futur**. Les séances privées ne sont jamais visibles.
- Horizon d'affichage : les **4 prochaines semaines** *(choix de conception)*.
- Si un cours auquel l'élève est inscrit est **annulé** par le coach, il reste visible pour
  lui avec la mention « Annulé » *(choix de conception)*.
- **S'inscrire** crée une `Participation` **« à régler »**, montant = prix de référence du
  cours — exactement comme quand le coach ajoute un élève aujourd'hui. Le coach la règle
  ensuite comme d'habitude (liquide → `ESPECES`, virement → `CB`, cf. ADR 0011).
- On peut s'inscrire **jusqu'au début** du cours *(choix de conception)*.
- **Capacité** : on ne peut pas s'inscrire si le nombre de participations atteint la
  capacité. Le contrôle est **atomique** (transaction) pour que deux réservations
  simultanées ne fassent pas dépasser la capacité. La capacité compte **toutes** les
  participations, y compris celles ajoutées par le coach.
- Le coach, lui, **peut dépasser** la capacité en ajoutant des élèves à la main ; il voit un
  avertissement *(choix de conception)*. Il peut aussi augmenter la capacité d'un cours.
- L'élève ne voit **que le nombre** d'inscrits, jamais leurs noms.
- Côté coach, la fiche séance et le planning affichent le remplissage (« 3 / 4 ») d'un cours
  collectif *(choix de conception)*. Les 3 séances collectives existantes reçoivent la
  capacité par défaut (4).

### 4.5 Désinscription

- **Délai par défaut : 24 h** avant le début du cours (Victor n'est pas sûr du délai idéal ;
  le garder dans **une constante unique** facile à changer).
- À moins de 24 h, le bouton disparaît ; l'élève doit contacter le coach.
- Se désinscrire **supprime** la participation. Si elle n'est plus « à régler » (déjà
  payée ou couverte par un pack par le coach), la désinscription est **bloquée** avec un
  message « contacte ton coach » *(choix de conception)*.

### 4.6 Profil

- L'élève voit prénom et nom (non modifiables en V1 *(choix de conception)*) et modifie
  **email, téléphone, adresse**.
- Changer d'email change l'identifiant de connexion ; il doit rester unique.
- Les **notes** du coach sur la fiche ne sont **jamais** exposées à l'élève.
- Le coach voit et peut modifier l'adresse sur la fiche élève.

---

## 5. Contraintes

- Stack existante, sans nouveau framework : **Next.js 16 (App Router)**, Auth.js v5
  (Credentials + JWT), Prisma 7 + PostgreSQL (Neon), Zod, shadcn/ui, Tailwind, Vitest.
  **Lire `node_modules/next/dist/docs/`** avant d'écrire du code (cf. `AGENTS.md`).
- Conventions du projet : pages en Server Components, écritures en **Server Actions**
  validées par **Zod**, logique pure isolée dans `lib/` et **testée (TDD)**, UI mobile-first,
  textes en français.
- Fuseau horaire unique (ADR 0006) : le délai de 24 h et « à venir » se calculent en heure
  serveur.
- Les migrations Prisma doivent préserver les données existantes (fiches sans email,
  séances collectives existantes → capacité 4).
- **Dépôt public** : aucun secret commité ; workflow branche → commits → push → PR → merge.
- **Production** : l'app est déployée sur Vercel (https://crm-bb-kohl.vercel.app/), sur la
  même base Neon. Les migrations doivent être appliquées à la base **avant** le
  déploiement du code qui en dépend (cf. ADR 0011), et l'ouverture de l'inscription en
  production ne doit arriver qu'avec la garde de rôle déjà en place.
- Mettre à jour la doc d'historique : nouvelles **ADR** (au minimum : rôles et gardes ;
  comptes élèves sur la fiche `Eleve` ; ouverture de l'inscription publique, qui revient
  sur l'ADR 0004) et le **CHANGELOG**.

---

## 6. Laissé au builder

- Découpage en phases et ordre de livraison (la garde de rôle doit arriver **avant** toute
  page d'inscription ouverte).
- Noms exacts des routes, champs, enums et composants.
- Forme exacte du calendrier élève (liste par jour, comme la maquette, est le point de
  départ).
- Protection anti-abus de l'inscription publique (limitation de débit, etc.) : à
  proportionner à un outil de coach indépendant.
- Règles de mot de passe (au minimum 8 caractères).

---

## 7. Étape suivante prévue

Après la V1 : **connexion Google** pour les élèves (Auth.js provider Google), puis reprise de
la discussion **paiement en ligne** (Stripe / QR code) avec le coach.

---

## 8. Évolution du 2026-10-28 (retour de Victor après test)

- **L'accueil de l'élève est son profil** (`/espace`) : coordonnées modifiables,
  **« Mes prochains cours »** et **« Mes cours passés »**, avec le statut de règlement
  (à régler / payé / pack). Le catalogue des cours collectifs devient l'onglet
  **« Réserver »** (`/espace/cours`).
- **Les séances privées de l'élève apparaissent dans son historique** (décision de Victor :
  « pour que les 2 ont un historique précis »). Cela revient sur le § 2 (« invisibles pour
  les élèves ») : l'élève voit **ses** séances privées, jamais celles des autres, et ne
  peut pas s'en désinscrire lui-même (elles restent gérées par le coach).
