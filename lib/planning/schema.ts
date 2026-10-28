import { z } from "zod";
import { montantSchema } from "@/lib/finances/money";

export const CAPACITE_PAR_DEFAUT = 4;

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
    prixReference: montantSchema,
    // Vide → capacité par défaut (4 places) ; utile surtout pour les cours collectifs.
    capacite: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : CAPACITE_PAR_DEFAUT))
      .pipe(z.number().int().min(1, "Au moins 1 place")),
    // Un cours collectif peut être créé vide : les élèves s'y inscrivent eux-mêmes.
    eleveIds: z.array(z.string().min(1)),
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
    capacite: String(formData.get("capacite") ?? ""),
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
