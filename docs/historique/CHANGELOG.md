# Journal de bord — CRM-BB

## 2026-07-16 — Fluidité mobile

- Fini le zoom iOS involontaire au focus : les selects natifs et l'input date passent à 16 px sur mobile.
- Barre d'onglets au-dessus de la barre d'accueil iPhone (safe area + `viewportFit: cover`).
- Taps immédiats : `touch-action: manipulation` sur les éléments interactifs (plus d'attente de double-tap).
- Retour tactile : léger enfoncement (`active:scale`) des cartes cliquables au tap.

## 2026-07-16 — Animations : cadence des sections espacée

- Les sections (`AnimBloc`) ont désormais leur propre rythme (120 ms d'écart au lieu de 45 ms) : sur Finances et ailleurs, les blocs arrivent en séquence lisible au lieu de tous en même temps.
- La section Impayés rejoint le flux de la page Finances (bloc n°4) ; sa cascade interne est retirée pour éviter la double animation.

## 2026-07-16 — Formulaire élève : fade-up Motion

- Les champs du formulaire d'informations (Nouvel élève / Modifier l'élève) apparaissent en cascade champ par champ.

## 2026-07-16 — Fiche élève : fade-up Motion

- Les sections de l'onglet Fiche (infos, récap payé/dû, packs, actions) apparaissent en fade-up cascadé, comme l'accueil et les finances.

## 2026-07-16 — Animations : passage à Motion (fade-up)

- Les animations d'apparition passent de CSS (tw-animate-css) à **Motion** : fade-up fluide des listes en cascade et des sections de pages (accueil, finances), transition de page en fondu.
- `AnimItem` garde la même API ; nouveau `AnimBloc` pour les sections. Mouvement désactivé via `useReducedMotion` (le CSS seul ne couvre pas les animations pilotées en JS).

## 2026-07-09 — Finitions suite au health check

- Les réglements (payer, annuler, pack) et les opérations de pack revalident aussi `/finances` et la fiche élève — plus de chiffres en retard après une action.
- `.env.example` complété avec `AUTH_TRUST_HOST` et `TZ` (requis pour Vercel).

## 2026-06-25 — Fiche élève : onglets Fiche / Historique

- L'historique des séances passe dans un onglet dédié (« Historique »), pour ne pas allonger la fiche des élèves fidèles. L'onglet « Fiche » garde infos, récap et packs.
- L'historique n'est chargé que lorsqu'on ouvre son onglet (requête évitée sinon).

## 2026-06-25 — Planning : dupliquer une séance

- Bouton « Dupliquer (semaine suivante) » sur la fiche séance : recrée une séance identique (type, heure, durée, lieu, tarif) 7 jours plus tard, **sans les élèves** (chaque séance n'a pas forcément les mêmes participants), puis ouvre sa page de modification.

## 2026-06-25 — Robustesse : pages d'erreur + middleware → proxy

- Ajout de `app/error.tsx` (boundary avec bouton « Réessayer ») et `app/not-found.tsx` (404) — fini les écrans blancs en cas de pépin.
- `middleware.ts` renommé en `proxy.ts` (convention Next 16 ; l'avertissement de dépréciation disparaît). Comportement de protection des routes inchangé.

## 2026-06-25 — Fiche élève enrichie

- Récap financier par élève : total **payé** (séances + packs) et **reste dû** (séances à régler), en sommes Decimal exactes.
- **Historique des séances** de l'élève (date, type, statut de réglement coloré, montant), cliquable vers la séance.

## 2026-06-22 — Élèves : onglets Actifs / Archivés

- La bascule par lien est remplacée par deux onglets « Actifs » / « Archivés » (segmented control corail), plus clairs. La recherche en cours est conservée au changement d'onglet.

## 2026-06-22 — Animations : interface plus dynamique

- Transition d'entrée de page en fondu doux (`template.tsx`).
- Listes (séances, élèves, impayés) qui apparaissent en cascade (fade + slide-up décalé) via le composant `AnimItem`.
- Léger lift + ombre au survol des cartes cliquables.
- Tout est neutralisé si l'utilisateur a activé « réduire les animations » (`prefers-reduced-motion`).

## 2026-06-22 — Packs : modifier et supprimer

- Sur la fiche élève, chaque pack peut être **modifié** (nb de séances, montant, méthode) — utile pour corriger une saisie ; le nombre de séances déjà utilisées est préservé et ne peut pas être dépassé.
- Chaque pack peut être **supprimé** (avec confirmation) ; les séances déjà couvertes par ce pack repassent en « à régler » et le paiement d'achat est retiré.

## 2026-06-22 — Paiements : retrait de la méthode « Virement »

- « Virement » retiré partout (réglement séance, création de pack, filtre finances) ; seules « Espèces » et « CB » restent.
- Valeur `VIREMENT` supprimée de l'enum en base ; les paiements existants en virement sont convertis en CB (migration) — voir ADR 0011.

## 2026-06-22 — Finances : montants ronds sans décimales

- `formatEuros` n'affiche plus « ,00 » pour les montants ronds (« 40 € ») ; les centimes restent affichés quand il y en a (« 45,50 € »). S'applique partout (cartes, listes, tooltips).

## 2026-06-22 — Finances : tooltip du camembert plus lisible

- Tooltip de la répartition : « : » ajouté après le libellé et montant affiché en euros formatés (au lieu du nombre brut collé au nom).

## 2026-06-22 — Finances : tooltip de la courbe plus lisible

- Le tooltip de la courbe d'évolution affiche désormais la date complète (« 15 juin », « juin 2026 », « 15 juin · 14h ») au lieu du seul numéro de jour, sans alourdir l'axe X.

## 2026-06-22 — Planning : libellé de la période affiché

- À côté des flèches de navigation, affichage de la période courante : « Semaine du X au Y » en vue semaine, le jour complet en vue jour.
- Helper pur `formatPlageSemaine` testé (gère les semaines à cheval sur deux mois).

## 2026-06-22 — Performance : états de chargement (navigation fluide)

- Ajout d'un composant `Skeleton` et d'un `loading.tsx` par section (accueil, planning, élèves, finances).
- La navigation entre onglets affiche désormais un squelette instantané pendant les requêtes serveur/DB, au lieu de figer l'écran sur la page précédente.

## 2026-06-21 — Correctif : menus déroulants en mode sombre

- `color-scheme` (light/dark) ajouté aux thèmes pour que les contrôles natifs (select, date) s'affichent correctement.
- Fond explicite (`bg-background`) sur les `<select>` et l'input date — fini le blanc sur blanc en sombre.

## 2026-06-21 — Finances : graphiques

- Répartition affichée en camembert (privé / collectif / packs).
- Courbe d'évolution du revenu sur la période (granularité selon le sélecteur) ; agrégation Decimal exacte.

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
