import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authenticateCoach } from "@/lib/auth/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const coach = await authenticateCoach(credentials, (email) =>
          prisma.coach.findUnique({ where: { email } }),
        );
        if (!coach) return null;
        return { id: coach.id, email: coach.email, name: coach.nom };
      },
    }),
  ],
});
