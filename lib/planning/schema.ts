import { z } from "zod";

export const seanceSchema = z
  .object({
    type: z.enum(["PRIVE", "COLLECTIF"]),
    dateHeureDebut: z.coerce.date(),
    dureeMinutes: z.coerce.number().int().min(1, "La durée doit être positive"),
    lieu: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    prixReference: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
    eleveIds: z.array(z.string().min(1)).min(1, "Sélectionnez au moins un élève"),
  })
  .refine((v) => v.type !== "PRIVE" || v.eleveIds.length === 1, {
    message: "Un cours privé doit avoir exactement un élève",
    path: ["eleveIds"],
  });

export type SeanceInput = z.infer<typeof seanceSchema>;

export type ParseResult =
  | { success: true; data: SeanceInput }
  | { success: false; errors: Record<string, string> };

export function parseSeanceForm(formData: FormData): ParseResult {
  const raw = {
    type: String(formData.get("type") ?? ""),
    dateHeureDebut: String(formData.get("dateHeureDebut") ?? ""),
    dureeMinutes: String(formData.get("dureeMinutes") ?? ""),
    lieu: String(formData.get("lieu") ?? ""),
    prixReference: String(formData.get("prixReference") ?? ""),
    eleveIds: formData.getAll("eleveIds").map((v) => String(v)),
  };
  const parsed = seanceSchema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
