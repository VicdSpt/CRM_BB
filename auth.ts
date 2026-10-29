import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth/credentials";
import { decisionConnexionGoogle } from "@/lib/auth/connexion-google";
import {
  effacerEchecsConnexion,
  enregistrerEchecConnexion,
  verifierConnexion,
} from "@/lib/securite/tentatives";
import { authConfig } from "@/auth.config";

// Google n'est activé que si ses identifiants sont configurés (AUTH_GOOGLE_ID / _SECRET,
// lus automatiquement par Auth.js) : sans eux, le site fonctionne comme avant.
export const googleActif = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

const trouverCoach = (email: string) =>
  // Le compte coach vient du seed (.env) : sa casse n'est pas garantie.
  prisma.coach.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

const trouverEleve = (email: string) => prisma.eleve.findUnique({ where: { email } });

const emailGoogle = (profile: { email?: string | null } | undefined) =>
  profile?.email?.trim().toLowerCase() ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      // La limite de tentatives est appliquée ICI (et pas seulement dans le formulaire) :
      // l'adresse de connexion d'Auth.js peut être appelée directement.
      authorize: async (credentials, request) => {
        const email = String(credentials?.email ?? "");
        if ((await verifierConnexion(email, request.headers)).bloque) return null;
        const utilisateur = await authenticate(credentials, {
          findCoach: trouverCoach,
          findEleve: trouverEleve,
        });
        if (utilisateur) await effacerEchecsConnexion(email);
        else await enregistrerEchecConnexion(email, request.headers);
        return utilisateur;
      },
    }),
    ...(googleActif ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Google ne crée jamais de compte : seul un élève existant (même email) peut entrer.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = emailGoogle(profile);
      const [eleve, coach] = await Promise.all([trouverEleve(email), trouverCoach(email)]);
      const decision = decisionConnexionGoogle({
        emailVerifie: profile?.email_verified === true,
        emailEstCoach: !!coach,
        eleve,
      });
      return decision.ok ? true : `/login?erreur=${decision.erreur}`;
    },
    // Avec Google, `user.id` est l'identifiant Google : on le remplace par celui de la fiche.
    async jwt(params) {
      if (params.account?.provider === "google") {
        const eleve = await trouverEleve(emailGoogle(params.profile));
        if (eleve) {
          params.token.id = eleve.id;
          params.token.role = "eleve";
          params.token.name = `${eleve.prenom} ${eleve.nom}`;
        }
        return params.token;
      }
      return authConfig.callbacks.jwt(params);
    },
  },
});
