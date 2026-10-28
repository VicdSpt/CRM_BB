"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accueilPour } from "@/lib/auth/roles";

export type LoginState = { error: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Redirige directement vers l'accueil du rôle : un rebond par « / » laisserait
  // l'URL sur « / » pour un élève (la redirection d'action ne repasse pas par le proxy).
  const email = String(formData.get("email") ?? "").trim();
  const estCoach = await prisma.coach.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: accueilPour(estCoach ? "coach" : "eleve"),
    });
    return { error: "" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Email ou mot de passe incorrect." };
  }
}
