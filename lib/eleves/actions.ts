"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCoach } from "@/lib/auth/require-coach";
import { parseEleveForm } from "@/lib/eleves/schema";

export type EleveFormState = { errors?: Record<string, string>; message?: string };

export async function createEleve(
  _prev: EleveFormState,
  formData: FormData,
): Promise<EleveFormState> {
  await requireCoach();
  const result = parseEleveForm(formData);
  if (!result.success) {
    return { errors: result.errors };
  }
  await prisma.eleve.create({ data: result.data });
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
  await prisma.eleve.update({ where: { id }, data: result.data });
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
  redirect(`/eleves/${id}`);
}

export async function setArchiveEleve(id: string, archive: boolean): Promise<void> {
  await requireCoach();
  await prisma.eleve.update({ where: { id }, data: { archive } });
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
}

export async function deleteEleve(id: string): Promise<void> {
  await requireCoach();
  await prisma.eleve.delete({ where: { id } });
  revalidatePath("/eleves");
  redirect("/eleves");
}
