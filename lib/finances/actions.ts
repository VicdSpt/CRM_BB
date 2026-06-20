"use server";

import { revalidatePath } from "next/cache";
import type { MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parsePackForm } from "@/lib/finances/pack-schema";

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

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
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

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
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
  return { message: "Pack créé." };
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

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
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

  revalidatePath(`/planning/${participation.seanceId}`);
  revalidatePath("/planning");
}
