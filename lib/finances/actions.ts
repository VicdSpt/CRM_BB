"use server";

import { revalidatePath } from "next/cache";
import type { MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parsePackForm } from "@/lib/finances/pack-schema";

// Un réglement change la fiche séance, le planning, le dashboard finances
// et le récap payé/dû de la fiche élève.
function revaliderApresReglement(seanceId: string, eleveId: string): void {
  revalidatePath(`/planning/${seanceId}`);
  revalidatePath("/planning");
  revalidatePath("/finances");
  revalidatePath(`/eleves/${eleveId}`);
}

export async function marquerPaye(
  participationId: string,
  methode: MethodePaiement,
): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "A_REGLER") return;

  try {
    await prisma.$transaction([
      prisma.paiement.create({
        data: {
          montant: participation.montant,
          methode,
          eleveId: participation.eleveId,
          participationId: participation.id,
        },
      }),
      prisma.participation.update({
        where: { id: participationId },
        data: { statutReglement: "PAYE" },
      }),
    ]);
  } catch (error) {
    // P2002 = contrainte d'unicité (un paiement existe déjà pour cette participation,
    // ex. double-clic concurrent) → on ignore, l'état final est correct.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return;
    }
    throw error;
  }

  revaliderApresReglement(participation.seanceId, participation.eleveId);
}

export async function annulerPaiement(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "PAYE") return;

  await prisma.$transaction([
    prisma.paiement.deleteMany({ where: { participationId } }),
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "A_REGLER" },
    }),
  ]);

  revaliderApresReglement(participation.seanceId, participation.eleveId);
}

export type PackFormState = { errors?: Record<string, string>; message?: string };

export async function creerPack(
  eleveId: string,
  _prev: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireCoach();
  const result = parsePackForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { nbSeancesTotal, montantPaye, methode } = result.data;

  await prisma.pack.create({
    data: {
      eleveId,
      nbSeancesTotal,
      nbSeancesRestantes: nbSeancesTotal,
      montantPaye,
      paiement: {
        create: { montant: montantPaye, methode, eleveId },
      },
    },
  });

  revalidatePath(`/eleves/${eleveId}`);
  revalidatePath("/finances");
  return { message: "Pack créé." };
}

export async function modifierPack(
  packId: string,
  _prev: PackFormState,
  formData: FormData,
): Promise<PackFormState> {
  await requireCoach();
  const result = parsePackForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { nbSeancesTotal, montantPaye, methode } = result.data;

  const pack = await prisma.pack.findUnique({ where: { id: packId } });
  if (!pack) return { errors: { nbSeancesTotal: "Pack introuvable." } };

  // On ne peut pas descendre le total sous le nombre de séances déjà consommées.
  const consommees = pack.nbSeancesTotal - pack.nbSeancesRestantes;
  if (nbSeancesTotal < consommees) {
    return {
      errors: { nbSeancesTotal: `Déjà ${consommees} séance(s) utilisée(s) sur ce pack.` },
    };
  }

  await prisma.$transaction([
    prisma.pack.update({
      where: { id: packId },
      data: { nbSeancesTotal, nbSeancesRestantes: nbSeancesTotal - consommees, montantPaye },
    }),
    // Le paiement d'achat lié suit le montant et la méthode du pack.
    prisma.paiement.updateMany({ where: { packId }, data: { montant: montantPaye, methode } }),
  ]);

  revalidatePath(`/eleves/${pack.eleveId}`);
  revalidatePath("/finances");
  return { message: "Pack modifié." };
}

export async function supprimerPack(packId: string): Promise<void> {
  await requireCoach();
  const pack = await prisma.pack.findUnique({ where: { id: packId } });
  if (!pack) return;

  await prisma.$transaction([
    // Les séances couvertes par ce pack repassent en « à régler ».
    prisma.participation.updateMany({
      where: { packId },
      data: { statutReglement: "A_REGLER", packId: null },
    }),
    prisma.paiement.deleteMany({ where: { packId } }),
    prisma.pack.delete({ where: { id: packId } }),
  ]);

  revalidatePath(`/eleves/${pack.eleveId}`);
  revalidatePath("/finances");
  revalidatePath("/planning");
}

export async function reglerAvecPack(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "A_REGLER") return;

  const pack = await prisma.pack.findFirst({
    where: { eleveId: participation.eleveId, nbSeancesRestantes: { gt: 0 } },
    orderBy: { dateAchat: "asc" },
  });
  if (!pack) return;

  await prisma.$transaction([
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "COUVERT_PAR_PACK", packId: pack.id },
    }),
    prisma.pack.update({
      where: { id: pack.id },
      data: { nbSeancesRestantes: { decrement: 1 } },
    }),
  ]);

  revaliderApresReglement(participation.seanceId, participation.eleveId);
}

export async function annulerPack(participationId: string): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (
    !participation ||
    participation.statutReglement !== "COUVERT_PAR_PACK" ||
    !participation.packId
  ) {
    return;
  }

  await prisma.$transaction([
    prisma.participation.update({
      where: { id: participationId },
      data: { statutReglement: "A_REGLER", packId: null },
    }),
    prisma.pack.update({
      where: { id: participation.packId },
      data: { nbSeancesRestantes: { increment: 1 } },
    }),
  ]);

  revaliderApresReglement(participation.seanceId, participation.eleveId);
}
