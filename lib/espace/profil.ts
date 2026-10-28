import { z } from "zod";

// Ce que l'élève peut modifier lui-même (jamais prénom, nom ni les notes du coach).
export const profilSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  telephone: z.string().trim().min(1, "Le téléphone est obligatoire"),
  adresse: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ProfilInput = z.infer<typeof profilSchema>;

export type ParseResult =
  | { success: true; data: ProfilInput }
  | { success: false; errors: Record<string, string> };

export function parseProfilForm(formData: FormData): ParseResult {
  const parsed = profilSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    telephone: String(formData.get("telephone") ?? ""),
    adresse: String(formData.get("adresse") ?? ""),
  });
  if (parsed.success) return { success: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

// L'email est l'identifiant de connexion : il doit rester unique (élèves ET coach).
// Les recherches de l'élève et du coach portant `email` sont faites par l'appelant.
export function verifierEmailLibre(
  _email: string,
  ctx: { eleveIdCourant: string; eleveAvecEmail: { id: string } | null; emailEstCoach: boolean },
): string | null {
  const prisParUnAutre = ctx.eleveAvecEmail && ctx.eleveAvecEmail.id !== ctx.eleveIdCourant;
  return ctx.emailEstCoach || prisParUnAutre ? "Cet email est déjà utilisé." : null;
}
