"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { StatutSeance } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseSeanceForm } from "@/lib/planning/schema";

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
  const { eleveIds, prixReference, ...seanceData } = result.data;
  await prisma.seance.create({
    data: {
      ...seanceData,
      prixReference,
      participations: {
        create: eleveIds.map((eleveId) => ({ eleveId, montant: prixReference })),
      },
    },
  });
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
  const { eleveIds, prixReference, ...seanceData } = result.data;

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

  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
  redirect(`/planning/${id}`);
}

export async function dupliquerSeance(id: string): Promise<void> {
  await requireCoach();
  const source = await prisma.seance.findUnique({ where: { id } });
  if (!source) return;

  // Duplique vers la semaine suivante, à la même heure locale, SANS les élèves :
  // chaque séance n'a pas forcément les mêmes participants. On construit la date
  // à partir des composants locaux pour éviter toute dérive d'heure (DST).
  const d = source.dateHeureDebut;
  const dateHeureDebut = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + 7,
    d.getHours(),
    d.getMinutes(),
    0,
    0,
  );

  const nouvelle = await prisma.seance.create({
    data: {
      type: source.type,
      dateHeureDebut,
      dureeMinutes: source.dureeMinutes,
      lieu: source.lieu,
      prixReference: source.prixReference,
    },
  });

  revalidatePath("/planning");
  redirect(`/planning/${nouvelle.id}/modifier`);
}

export async function setStatutSeance(id: string, statut: StatutSeance): Promise<void> {
  await requireCoach();
  await prisma.seance.update({ where: { id }, data: { statut } });
  revalidatePath("/planning");
  revalidatePath(`/planning/${id}`);
}

export async function deleteSeance(id: string): Promise<void> {
  await requireCoach();
  await prisma.seance.delete({ where: { id } });
  revalidatePath("/planning");
  redirect("/planning");
}
