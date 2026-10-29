# ADR 0015 — Durcissement : limite de tentatives, en-têtes de sécurité, sessions courtes

**Date :** 2026-10-29
**Statut :** Accepté

## Contexte

Le health check / security check du 2026-10-29 a relevé que l'inscription est publique et
que rien ne limitait les essais de mots de passe ni la création de comptes en masse. Les
réponses ne portaient aucun en-tête de sécurité (hors HSTS ajouté par Vercel) et les sessions
duraient 30 jours, pour un outil contenant des données personnelles et financières.

## Décision

- **Limite de tentatives**, stockée en base (table `TentativeAcces`) car l'app tourne sur des
  fonctions serverless sans mémoire partagée :
  - connexion : 5 échecs / 15 min par email, 20 échecs / 15 min par adresse IP ; une connexion
    réussie remet à zéro le compteur de l'email ;
  - inscription : 5 / heure par adresse IP.
  - Appliquée dans `authorize` d'Auth.js (l'adresse de connexion peut être appelée sans passer
    par le formulaire) ; le formulaire relit le même compteur pour afficher le message.
  - L'IP n'est jamais stockée en clair (empreinte SHA-256 salée par `AUTH_SECRET`) ; les
    lignes de plus de 24 h sont purgées à chaque écriture.
  - Règles pures testées dans `lib/securite/limite.ts`.
- **En-têtes de sécurité** (`next.config.ts`) : CSP limitée au site (+ Google pour
  `form-action`), `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy` ; `X-Powered-By` supprimé.
- **Sessions** : 7 jours (`session.maxAge`, partagé avec le proxy).

## Alternatives écartées

- **Compteurs en mémoire** : non fiables sur plusieurs instances serverless.
- **Redis (Upstash) / règles du pare-feu Vercel** : service ou offre supplémentaire pour un
  volume très faible ; la base existante suffit.
- **CSP stricte à nonces** : impose le rendu dynamique de toutes les pages et l'injection du
  nonce dans le proxy ; `'unsafe-inline'` est conservé pour les scripts de Next et du thème.

## Conséquences

- Une table et deux index de plus ; une requête courte par tentative de connexion.
- Une connexion partagée (même IP) très sollicitée pourrait atteindre 20 échecs : seuil
  volontairement large.
- Les utilisateurs se reconnectent au plus tard après 7 jours.
