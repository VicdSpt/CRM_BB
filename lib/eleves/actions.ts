"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { flash } from "@/lib/flash-serveur";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseEleveForm } from "@/lib/eleves/schema";
import { estDoublonUnique } from "@/lib/prisma-erreurs";

export type EleveFormState = { errors?: Record<string, string>; message?: string };

const EMAIL_DEJA_PRIS: EleveFormState = {
  errors: { email: "Cet email est déjà utilisé par un autre élève." },
};
const EMAIL_DU_COACH: EleveFormState = {
  errors: { email: "Cet email est celui du compte coach." },
};

// L'email sert d'identifiant de connexion : celui du coach ne peut pas aller sur une fiche
// élève (le coach étant cherché en premier, l'élève ne pourrait jamais se connecter).
async function estEmailDuCoach(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const coach = await prisma.coach.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return !!coach;
}

export async function createEleve(
  _prev: EleveFormState,
  formData: FormData,
): Promise<EleveFormState> {
  await requireCoach();
  const result = parseEleveForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  if (await estEmailDuCoach(result.data.email)) return EMAIL_DU_COACH;
  try {
    await prisma.eleve.create({ data: result.data });
  } catch (e) {
    if (estDoublonUnique(e)) return EMAIL_DEJA_PRIS;
    throw e;
  }
  await flash("Élève créé.");
  revalidatePath("/eleves");
  redirect("/eleves");
}

export async function updateEleve(
  id: string,
  _prev: EleveFormState,
  formData: FormData,
): Promise<EleveFormState> {
  await requireCoach();
  const result = parseEleveForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  if (await estEmailDuCoach(result.data.email)) return EMAIL_DU_COACH;
  try {
    await prisma.eleve.update({ where: { id }, data: result.data });
  } catch (e) {
    if (estDoublonUnique(e)) return EMAIL_DEJA_PRIS;
    throw e;
  }
  revalidatePath("/eleves");
  await flash("Modifications enregistrées.");
  revalidatePath(`/eleves/${id}`);
  redirect(`/eleves/${id}`);
}

// L'identité saisie à l'inscription ne sert qu'à la décision du coach.
const IDENTITE_INSCRIPTION_EFFACEE = {
  inscriptionPrenom: null,
  inscriptionNom: null,
  inscriptionTelephone: null,
};

export async function validerCompte(id: string): Promise<void> {
  await requireCoach();
  await prisma.eleve.update({
    where: { id },
    data: { statutCompte: "VALIDE", ...IDENTITE_INSCRIPTION_EFFACEE },
  });
  await flash("Compte validé.");
  revalidatePath("/eleves");
}

// Refus : une fiche créée par l'inscription disparaît ; une fiche existante
// (créée par le coach puis rattachée) perd seulement ses infos de compte.
export async function refuserCompte(id: string): Promise<void> {
  await requireCoach();
  const eleve = await prisma.eleve.findUnique({ where: { id } });
  if (!eleve) return;
  if (eleve.creeParInscription) {
    await prisma.eleve.delete({ where: { id } });
  } else {
    await prisma.eleve.update({
      where: { id },
      data: { motDePasse: null, statutCompte: "AUCUN", ...IDENTITE_INSCRIPTION_EFFACEE },
    });
  }
  await flash("Demande refusée.");
  revalidatePath("/eleves");
}

export async function setArchiveEleve(id: string, archive: boolean): Promise<void> {
  await requireCoach();
  await prisma.eleve.update({ where: { id }, data: { archive } });
  await flash(archive ? "Élève archivé." : "Élève désarchivé.");
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
}

export async function deleteEleve(id: string): Promise<void> {
  await requireCoach();
  const [participations, packs, paiements] = await Promise.all([
    prisma.participation.count({ where: { eleveId: id } }),
    prisma.pack.count({ where: { eleveId: id } }),
    prisma.paiement.count({ where: { eleveId: id } }),
  ]);
  if (participations + packs + paiements > 0) {
    // Sécurité : un élève avec historique ne peut pas être supprimé → on archive.
    await prisma.eleve.update({ where: { id }, data: { archive: true } });
    await flash("Élève archivé : il a un historique, il ne peut pas être supprimé.");
    revalidatePath("/eleves");
    revalidatePath(`/eleves/${id}`);
    redirect(`/eleves/${id}`);
  }
  await prisma.eleve.delete({ where: { id } });
  await flash("Élève supprimé.");
  revalidatePath("/eleves");
  redirect("/eleves");
}
