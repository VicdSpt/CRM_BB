"use server";

import { revalidatePath } from "next/cache";
import type { MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";

export async function marquerPaye(
  participationId: string,
  methode: MethodePaiement,
): Promise<void> {
  await requireCoach();
  const participation = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!participation || participation.statutReglement !== "A_REGLER") return;

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
