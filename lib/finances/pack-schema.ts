import { z } from "zod";
import { montantSchema } from "./money";

export const packSchema = z.object({
  nbSeancesTotal: z.coerce.number().int().min(1, "Au moins 1 séance"),
  montantPaye: montantSchema,
  methode: z.enum(["ESPECES", "CB"]),
});

export type PackInput = z.infer<typeof packSchema>;

export type PackParseResult =
  | { success: true; data: PackInput }
  | { success: false; errors: Record<string, string> };

export function parsePackForm(formData: FormData): PackParseResult {
  const raw = {
    nbSeancesTotal: String(formData.get("nbSeancesTotal") ?? ""),
    montantPaye: String(formData.get("montantPaye") ?? ""),
    methode: String(formData.get("methode") ?? ""),
  };
  const parsed = packSchema.safeParse(raw);
  if (parsed.success) return { success: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
