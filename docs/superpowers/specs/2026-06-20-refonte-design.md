# Refonte du design — CRM-BB

**Date :** 2026-06-20
**Statut :** Design validé (brainstorming)
**Auteur :** Victor

---

## 1. Contexte & objectif

Le CRM est **fonctionnellement complet** (auth, élèves, planning, finances) mais son UI est
volontairement sobre (composants shadcn par défaut, Tailwind minimal, pages isolées). Objectif :
une interface **moderne, sérieuse, agréable à utiliser et à regarder**, et surtout d'une
**lisibilité immédiate** — en ouvrant l'app, le coach comprend tout de suite quoi faire.

**Direction artistique :** mix **pro & épuré** (base) + **sportif & énergique** (accents).
Usage : surtout **mobile en journée** (iPhone), parfois **PC le soir**.

**Périmètre :** purement **présentation et navigation**. Aucune logique métier, Server Action,
règle de sécurité ou calcul n'est modifié.

---

## 2. Système de design (jetons)

Tout découle de jetons définis en **variables CSS** (deux jeux de valeurs : clair / sombre),
ce qui garantit la cohérence et rend la bascule de thème gratuite.

### Couleurs

- **Accent corail** (≈ `#F1542E`) — réservé aux **actions principales** et éléments à mettre
  en avant ; utilisé avec parcimonie pour guider l'œil.
- **Neutres chauds** :
  - _Clair_ : fond `#FAFAF9`, cartes blanches, bordures discrètes.
  - _Sombre_ : fond `#0C0A09`, cartes gris foncé, bordures subtiles.
- **Couleurs sémantiques (statuts)**, harmonisées et **toujours doublées d'un texte/icône**
  (jamais la couleur seule) : payé = vert, à régler = ambre, annulé = rouge atténué,
  couvert par pack = corail/bleu.

### Typographie

- Sans-serif moderne et lisible : **Geist Sans** (via `next/font`), parfaitement adaptée à Next.js.
- Titres légèrement marqués ; **chiffres en tabulaire** pour les montants (alignement finances).

### Formes & espacement

- Coins **arrondis moyens** (≈ 10–12 px) sur cartes/boutons/champs.
- Espacement généreux et cohérent ; ombres légères sur les cartes pour la profondeur.

### Icônes

- **`lucide-react`** (léger, cohérent) pour la navigation et les actions.

---

## 3. Navigation adaptative

Une coquille de layout unique enveloppe toutes les pages connectées.

### Mobile — barre d'onglets en bas (toujours visible)

- 4 onglets icône + label : **Accueil · Planning · Élèves · Finances**.
- Onglet actif en **corail** ; changement de section en un tap (pas de menu à ouvrir).
- Fine **barre du haut** : nom « CRM-BB » + **bascule clair/sombre**.
- **Déconnexion** rangée en bas du tableau de bord (action rare).

### PC — barre latérale gauche

- **Sidebar** fixe : 4 sections + bascule thème + déconnexion en bas.
- Section active en corail ; contenu à droite dans une largeur confortable.

### Commun

- Plus de liens « ← retour » comme navigation principale ; retours contextuels fins conservés
  (ex. fiche → liste).
- La page **connexion** reste hors coquille, plein écran épuré.

---

## 4. Accueil = tableau de bord du jour

De haut en bas :

1. **En-tête de bienvenue** : « Bonjour 👋 » + date du jour.
2. **Cours d'aujourd'hui** (cœur) : carte listant les séances du jour triées par heure
   (heure, type, élève(s), badge de statut) ; le **prochain cours** est mis en avant
   (encadré corail). État vide soigné + bouton « Planifier une séance ».
3. **Raccourcis** : **+ Nouvelle séance** et **+ Nouvel élève**.
4. **Aperçu finances compact** : **encaissé ce mois** + **impayés**, cliquables → Finances.
5. **Déconnexion** : lien sobre en bas (mobile).

---

## 5. Restyle des écrans existants

Mêmes patterns partout (un seul langage visuel) :

- **Cartes** arrondies + ombre légère ; **listes** aérées, lignes cliquables, états au survol/pression.
- **Badges de statut** couleur + texte.
- **Boutons** : principale = corail plein, secondaire = contour, destructif = rouge ; cibles ≥ 44 px.
- **Formulaires** : libellés clairs, erreurs sous le champ, bouton avec état « en cours… ».
- **États vides** soignés (message + action).

Par écran :

- **Planning** : barre jour/semaine + flèches plus visuelles ; séances en **cartes colorées par
  type** (privé/collectif) ; fiche séance avec participants + boutons de règlement corail.
- **Élèves** : recherche en évidence ; liste en lignes avec **initiales en pastille** ; fiche
  claire (infos, **packs avec jauge de séances restantes**, actions).
- **Finances** : **total encaissé** en grand chiffre ; période en onglets ; répartition avec
  **petites barres de proportion** (privé/collectif/packs) ; impayés en liste nette.

---

## 6. Mode sombre, technique & accessibilité

### Mode sombre

- **Variables CSS** (deux jeux de jetons) + **`next-themes`**.
- Suit le réglage système au départ (clair jour / sombre soir) ; bouton clair/sombre/auto ;
  choix mémorisé ; pas de flash au chargement.

### Technique (sans casser l'existant)

- On **garde shadcn/ui + Tailwind** ; personnalisation du thème (jetons, rayons, typo).
- Police via `next/font` ; icônes via `lucide-react`.
- Nouvelle **coquille de layout** (sidebar PC / onglets mobile / barre du haut) dans le layout
  racine ; page connexion hors coquille.
- **Aucune logique métier modifiée** — uniquement présentation/navigation. Server Actions,
  sécurité, calculs : inchangés.

### Accessibilité & qualité

- Contrastes suffisants (corail testé sur clair **et** sombre).
- Statuts = couleur **+ texte/icône**.
- Cibles tactiles ≥ 44 px ; focus clavier visible ; libellés de formulaire reliés.
- **Build vert, lint propre, tests au vert** maintenus (les tests existants ne dépendent pas du style).

---

## 7. Découpage en sous-phases (un plan + une PR chacune)

1. **Système de design + mode sombre** : jetons CSS clair/sombre, couleur corail, typo (`next/font`),
   `lucide-react`, `next-themes`, bascule de thème. (Cette branche : `feat/design-systeme`.)
2. **Coquille de navigation** : sidebar PC + onglets mobile + barre du haut ; intégration au layout.
3. **Tableau de bord d'accueil** : refonte de `/` en dashboard du jour.
4. **Restyle Élèves**.
5. **Restyle Planning**.
6. **Restyle Finances**.

Chaque sous-phase est testable et mergeable indépendamment. Le design n'altère pas les tests
existants (logique inchangée) ; on garde lint/tests/build au vert à chaque étape.

---

## 8. Hors périmètre

- Toute modification de logique métier, de schéma, de sécurité ou de calcul.
- Nouvelles fonctionnalités (accès élèves, notifications, vue mois…) — restent pour plus tard.
- Refonte de la page de connexion au-delà d'un simple alignement visuel (elle reste épurée).
