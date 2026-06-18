import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const eleveSchema = z.object({
  prenom: z.string().trim().min(1, "Le prénom est obligatoire"),
  nom: z.string().trim().min(1, "Le nom est obligatoire"),
  telephone: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().email("Email invalide").optional()),
  notes: optionalText,
});

export type EleveInput = z.infer<typeof eleveSchema>;

export type ParseResult =
  | { success: true; data: EleveInput }
  | { success: false; errors: Record<string, string> };

export function parseEleveForm(formData: FormData): ParseResult {
  const raw = {
    prenom: String(formData.get("prenom") ?? ""),
    nom: String(formData.get("nom") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const parsed = eleveSchema.safeParse(raw);
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
