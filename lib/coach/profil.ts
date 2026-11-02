import { z } from "zod";
import { messageMotDePasseFaible } from "@/lib/auth/force-mot-de-passe";

// Profil du coach : son nom et son email de connexion, modifiables par lui seul.
const infosSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  email: z.string().trim().toLowerCase().email("Email invalide."),
});

export type InfosCoach = z.infer<typeof infosSchema>;

export function parseInfosCoach(
  formData: FormData,
): { success: true; data: InfosCoach } | { success: false; errors: Record<string, string> } {
  const parsed = infosSchema.safeParse({
    nom: String(formData.get("nom") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (parsed.success) return { success: true, data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

export type ChangementMotDePasse = { actuel: string; nouveau: string; confirmation: string };

// Vérifications sans base de données ; l'exactitude du mot de passe actuel est
// contrôlée ensuite par l'action (comparaison avec l'empreinte enregistrée).
export function verifierNouveauMotDePasse(c: ChangementMotDePasse): Record<string, string> | null {
  if (!c.actuel) return { actuel: "Indique ton mot de passe actuel." };
  const faible = messageMotDePasseFaible(c.nouveau);
  if (faible) return { nouveau: faible };
  if (c.confirmation !== c.nouveau) {
    return { confirmation: "Les deux mots de passe ne correspondent pas." };
  }
  if (c.nouveau === c.actuel) return { nouveau: "Choisis un mot de passe différent de l'actuel." };
  return null;
}
