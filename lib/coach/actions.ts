"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { flash } from "@/lib/flash-serveur";
import { requireCoach } from "@/lib/auth/require-coach";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { estDoublonUnique } from "@/lib/prisma-erreurs";
import { parseInfosCoach, verifierNouveauMotDePasse } from "./profil";

export type ProfilCoachState = { errors?: Record<string, string>; ok?: number };

const EMAIL_DEJA_PRIS = { errors: { email: "Cet email est déjà utilisé." } };

// Le coach modifie son nom et son email de connexion (toujours le coach de la SESSION).
export async function modifierInfosCoach(
  _prev: ProfilCoachState,
  formData: FormData,
): Promise<ProfilCoachState> {
  const session = await requireCoach();
  const result = parseInfosCoach(formData);
  if (!result.success) return { errors: result.errors };
  const { nom, email } = result.data;

  // L'email est l'identifiant de connexion : il ne doit pas être celui d'un élève.
  const eleve = await prisma.eleve.findUnique({ where: { email }, select: { id: true } });
  if (eleve) return EMAIL_DEJA_PRIS;
  try {
    await prisma.coach.update({ where: { id: session.user.id }, data: { nom, email } });
  } catch (e) {
    if (estDoublonUnique(e)) return EMAIL_DEJA_PRIS;
    throw e;
  }
  await flash("Informations enregistrées.");
  revalidatePath("/profil");
  return { ok: Date.now() };
}

export async function changerMotDePasseCoach(
  _prev: ProfilCoachState,
  formData: FormData,
): Promise<ProfilCoachState> {
  const session = await requireCoach();
  const saisie = {
    actuel: String(formData.get("actuel") ?? ""),
    nouveau: String(formData.get("nouveau") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  };
  const erreurs = verifierNouveauMotDePasse(saisie);
  if (erreurs) return { errors: erreurs };

  const coach = await prisma.coach.findUnique({
    where: { id: session.user.id },
    select: { motDePasse: true },
  });
  if (!coach || !(await verifyPassword(saisie.actuel, coach.motDePasse))) {
    return { errors: { actuel: "Mot de passe actuel incorrect." } };
  }
  await prisma.coach.update({
    where: { id: session.user.id },
    data: { motDePasse: await hashPassword(saisie.nouveau) },
  });
  await flash("Mot de passe modifié.");
  // « ok » change à chaque succès : le formulaire s'en sert pour se vider.
  return { ok: Date.now() };
}
