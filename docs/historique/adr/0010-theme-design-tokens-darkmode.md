# ADR 0010 — Thème par jetons CSS + mode sombre (next-themes)

**Date :** 2026-06-20
**Statut :** Accepté

## Contexte

La refonte du design veut une identité corail/pro et un mode sombre, sans dupliquer les
styles ni alourdir le bundle.

## Décision

On s'appuie sur les **jetons CSS** déjà en place (Tailwind v4, oklch) avec deux jeux de
valeurs (`:root` clair / `.dark` sombre). L'accent `--primary`/`--ring` passe en corail
(`oklch(0.64 0.19 33)` clair, `oklch(0.69 0.19 33)` sombre). La bascule de thème utilise
**`next-themes`** (classe `dark` sur `<html>`, suivi du système, choix mémorisé,
`suppressHydrationWarning` pour éviter le flash).

## Alternatives écartées

- Thème géré à la main (contexte React + localStorage) : réinvente `next-themes`.
- Deux feuilles de style séparées : duplication et risque d'incohérence.

## Conséquences

- Bascule clair/sombre gratuite pour tous les composants qui consomment les jetons.
- Toute nouvelle couleur doit passer par un jeton (clair + sombre) pour rester cohérente.
