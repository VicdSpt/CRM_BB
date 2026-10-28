import { z } from "zod";

const seanceIdSchema = z.string().min(1);

// Les Server Actions reçoivent leurs arguments du navigateur : un appel forgé peut
// envoyer n'importe quoi. On ne garde qu'une chaîne non vide.
export function parseSeanceId(valeur: unknown): string | null {
  const parsed = seanceIdSchema.safeParse(valeur);
  return parsed.success ? parsed.data : null;
}
