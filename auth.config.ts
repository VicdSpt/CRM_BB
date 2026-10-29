import type { NextAuthConfig } from "next-auth";
import { routeAutorisee } from "@/lib/auth/roles";

export const authConfig = {
  pages: { signIn: "/login" },
  // Sessions JWT de 7 jours (30 par défaut) : l'outil contient des données personnelles
  // et financières. Partagé avec le proxy pour une durée identique partout.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [], // les providers avec accès DB restent dans auth.ts
  callbacks: {
    // À la connexion, on copie l'id et le rôle dans le jeton…
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // …puis du jeton vers la session lue par les pages.
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    authorized({ auth, request }) {
      const decision = routeAutorisee(request.nextUrl.pathname, auth?.user?.role ?? null);
      if ("redirect" in decision) {
        return Response.redirect(new URL(decision.redirect, request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
