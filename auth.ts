import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth/credentials";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: (credentials) =>
        authenticate(credentials, {
          // Le compte coach vient du seed (.env) : sa casse n'est pas garantie.
          findCoach: (email) =>
            prisma.coach.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }),
          findEleve: (email) => prisma.eleve.findUnique({ where: { email } }),
        }),
    }),
  ],
});
