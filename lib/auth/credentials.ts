import { z } from "zod";
import type { StatutCompte } from "@prisma/client";
import { verifyPassword } from "./password";
import type { Role } from "./roles";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type CoachRecord = {
  id: string;
  email: string;
  motDePasse: string;
  nom: string;
};

export type EleveAuthRecord = {
  id: string;
  email: string | null;
  prenom: string;
  nom: string;
  motDePasse: string | null;
  statutCompte: StatutCompte;
  archive: boolean;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type Finders = {
  findCoach: (email: string) => Promise<CoachRecord | null>;
  findEleve: (email: string) => Promise<EleveAuthRecord | null>;
};

// Cherche d'abord un coach, puis un élève ayant un compte (en attente ou validé).
export async function authenticate(
  input: unknown,
  { findCoach, findEleve }: Finders,
): Promise<AuthenticatedUser | null> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const coach = await findCoach(email);
  if (coach) {
    if (!(await verifyPassword(password, coach.motDePasse))) return null;
    return { id: coach.id, email: coach.email, name: coach.nom, role: "coach" };
  }

  const eleve = await findEleve(email);
  if (!eleve || !eleve.motDePasse || eleve.archive || eleve.statutCompte === "AUCUN") {
    return null;
  }
  if (!(await verifyPassword(password, eleve.motDePasse))) return null;
  return { id: eleve.id, email, name: `${eleve.prenom} ${eleve.nom}`, role: "eleve" };
}
