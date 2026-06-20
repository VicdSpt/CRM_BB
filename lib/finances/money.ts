import { z } from "zod";

export const montantSchema = z
  .string()
  .trim()
  .refine((s) => /^\d+(\.\d{1,2})?$/.test(s), "Montant invalide (max 2 décimales, positif)");

export function parseMontant(
  input: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  const parsed = montantSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Montant invalide" };
}
