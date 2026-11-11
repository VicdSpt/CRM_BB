"use server";

import { revalidatePath } from "next/cache";
import type { MethodePaiement } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { flash } from "@/lib/flash-serveur";
import { requireCoach } from "@/lib/auth/require-coach";

// Un réglement change la fiche séance, le planning, le dashboard finances
// et le récap payé/dû de la fiche élève.
function revaliderApresReglement(seanceId: string, eleveId: string): void {
  revalidatePath(`/planning/${seanceId}`);
  revalidatePath("/planning");
  revalidatePath("/profil");
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

  await flash("Paiement enregistré.");
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

  await flash("Paiement annulé.", "alerte");
  revaliderApresReglement(participation.seanceId, participation.eleveId);
}
