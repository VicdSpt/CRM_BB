"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { accueilPour } from "@/lib/auth/roles";
import { messageTropDeTentatives } from "@/lib/securite/limite";
import { verifierConnexion } from "@/lib/securite/tentatives";

export type LoginState = { error: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Redirige directement vers l'accueil du rôle : un rebond par « / » laisserait
  // l'URL sur « / » pour un élève (la redirection d'action ne repasse pas par le proxy).
  const email = String(formData.get("email") ?? "").trim();
  const entetes = await headers();
  // La limite est appliquée par Auth.js (authorize) ; ici on affiche juste le bon message.
  const avant = await verifierConnexion(email, entetes);
  if (avant.bloque) return { error: messageTropDeTentatives(avant.minutesRestantes) };

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
    // Cet échec a peut-être atteint le seuil : on le dit tout de suite.
    const apres = await verifierConnexion(email, entetes);
    if (apres.bloque) return { error: messageTropDeTentatives(apres.minutesRestantes) };
    return { error: "Email ou mot de passe incorrect." };
  }
}

// Connexion Google (élèves uniquement) : la décision se prend dans le callback `signIn`
// d'auth.ts, qui renvoie vers /login?erreur=… si le compte n'est pas accepté.
export async function loginGoogle(): Promise<void> {
  await signIn("google", { redirectTo: accueilPour("eleve") });
}
