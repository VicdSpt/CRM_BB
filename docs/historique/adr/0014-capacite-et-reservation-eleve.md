# ADR 0014 — Capacité des cours collectifs et réservation par les élèves

**Date :** 2026-10-28
**Statut :** Accepté

## Contexte

Les élèves validés réservent eux-mêmes les cours collectifs du coach (spec
`2026-10-27-espace-eleve-design.md`). Un cours a un nombre de places limité ; deux élèves
peuvent viser la dernière place au même moment.

## Décision

- `Seance.capacite` (entier, **4 par défaut**), saisi par le coach pour un cours collectif.
  Un cours collectif peut désormais être créé **sans élève**.
- **Seuls les élèves** sont bloqués quand un cours est complet ; le coach peut dépasser
  la capacité en ajoutant des élèves à la main (avertissement dans le formulaire).
- Réservation dans une **transaction avec verrou de ligne** (`SELECT … FOR UPDATE` sur la
  séance) : les réservations simultanées sont sérialisées. Vérifié par
  `scripts/verif-reservation-concurrente.ts` (sans le verrou : 2 réservations sur 1 place).
- Une réservation crée une `Participation` **« à régler »** au prix du cours ; le coach
  encaisse comme avant. Les **packs sont ignorés** par la réservation élève.
- Désinscription par l'élève jusqu'à **24 h** avant le cours (constante unique
  `DELAI_DESINSCRIPTION_HEURES`), et seulement si la participation est encore « à régler ».
- Règles (places, états, droit de s'inscrire / se désinscrire) en fonctions pures testées
  (`lib/espace/regles.ts`).

## Alternatives écartées

- **Contrainte en base sur le nombre de participations** : PostgreSQL ne l'exprime pas
  simplement (il faudrait un trigger) ; le verrou applicatif suffit pour ce volume.
- **Niveau d'isolation SERIALIZABLE** : impose de rejouer les transactions en échec, plus
  complexe que le verrou de ligne pour un seul point de contention.
- **Consommer automatiquement un pack** : écarté, les packs sont amenés à disparaître.

## Conséquences

- Les réservations sur un même cours sont traitées l'une après l'autre (négligeable).
- Le délai de 24 h se change à un seul endroit quand le coach aura tranché.
