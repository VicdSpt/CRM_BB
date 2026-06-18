import { z } from "zod";
import { verifyPassword } from "./password";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CoachRecord = {
  id: string;
  email: string;
  motDePasse: string;
  nom: string;
};

export type AuthenticatedCoach = {
  id: string;
  email: string;
  nom: string;
};

export async function authenticateCoach(
  input: unknown,
  findCoachByEmail: (email: string) => Promise<CoachRecord | null>,
): Promise<AuthenticatedCoach | null> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;

  const coach = await findCoachByEmail(parsed.data.email);
  if (!coach) return null;

  const ok = await verifyPassword(parsed.data.password, coach.motDePasse);
  if (!ok) return null;

  return { id: coach.id, email: coach.email, nom: coach.nom };
}
