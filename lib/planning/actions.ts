"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { StatutSeance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { flash } from "@/lib/flash-serveur";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseSeanceForm } from "@/lib/planning/schema";
import { datesRepetees } from "@/lib/planning/dates";

export type SeanceFormState = { errors?: Record<string, string>; message?: string };

export async function createSeance(
  _prev: SeanceFormState,
  formData: FormData,
): Promise<SeanceFormState> {
  await requireCoach();
  const result = parseSeanceForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const { eleveIds, prixReference, repetition, dateHeureDebut, ...seanceData } = result.data;
  // Une séance par semaine demandée, toutes créées ou aucune.
  await prisma.$transaction(
    datesRepetees(dateHeureDebut, repetition).map((date) =>
      prisma.seance.create({
        data: {
          ...seanceData,
          dateHeureDebut: date,
          prixReference,
          participations: {
            create: eleveIds.map((eleveId) => ({ eleveId, montant: prixReference })),
          },
        },
      }),
    ),
  );
  await flash(repetition > 1 ? `${repetition} séances créées.` : "Séance créée.");
  revalidatePath("/planning");
  redirect("/planning");
}

export async function updateSeance(
  id: string,
  _prev: SeanceFormState,
  formData: FormData,
): Promise<SeanceFormState> {
  await requireCoach();
  const result = parseSeanceForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  const {
    eleveIds,
    prixReference,
    repetition,
    type,
    dateHeureDebut,
    dureeMinutes,
    lieu,
    capacite,
  } = result.data;
  const seanceData = { type, dateHeureDebut, dureeMinutes, lieu, capacite };
  let ajoutees = 0;

  // Cours collectif : les inscriptions sont faites par les élèves, on n'y touche pas.
  // « Répéter » ajoute des copies vides les semaines suivantes (la séance modifiée est la 1re).
  if (seanceData.type === "COLLECTIF") {
    const copies = datesRepetees(dateHeureDebut, repetition).slice(1);
    ajoutees = copies.length;
    await prisma.$transaction([
      prisma.seance.update({ where: { id }, data: { ...seanceData, prixReference } }),
      ...copies.map((date) =>
        prisma.seance.create({ data: { ...seanceData, dateHeureDebut: date, prixReference } }),
      ),
    ]);
  } else {
    // Cours privé : la séance n'a que l'élève choisi dans le menu.
    const existing = await prisma.participation.findMany({
      where: { seanceId: id },
      select: { eleveId: true },
    });
    const existingIds = new Set(existing.map((p) => p.eleveId));
    const nextIds = new Set(eleveIds);
    const toAdd = eleveIds.filter((e) => !existingIds.has(e));
    const toRemove = [...existingIds].filter((e) => !nextIds.has(e));

    await prisma.$transaction([
      prisma.seance.update({ where: { id }, data: { ...seanceData, prixReference } }),
      prisma.participation.deleteMany({ where: { seanceId: id, eleveId: { in: toRemove } } }),
      ...toAdd.map((eleveId) =>
        prisma.participation.create({ data: { seanceId: id, eleveId, montant: prixReference } }),
      ),
    ]);
  }

  await flash(
    ajoutees > 0
      ? `Séance modifiée, ${ajoutees} séance${ajoutees > 1 ? "s" : ""} ajoutée${ajoutees > 1 ? "s" : ""} les semaines suivantes.`
      : "Séance modifiée.",
  );
  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
  redirect(`/planning/${id}`);
}

const MESSAGE_STATUT: Record<StatutSeance, string> = {
  REALISEE: "Séance marquée comme réalisée.",
  ANNULEE: "Séance annulée.",
  PLANIFIEE: "Séance replanifiée.",
};

export async function setStatutSeance(id: string, statut: StatutSeance): Promise<void> {
  await requireCoach();
  await prisma.seance.update({ where: { id }, data: { statut } });
  await flash(MESSAGE_STATUT[statut]);
  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
}

export async function deleteSeance(id: string): Promise<void> {
  await requireCoach();
  await prisma.seance.delete({ where: { id } });
  await flash("Séance supprimée.");
  revalidatePath("/planning");
  redirect("/planning");
}
