import { Prisma } from "@prisma/client";

// Violation d'une contrainte d'unicité (ex. deux comptes qui prennent le même email
// au même moment) : à transformer en message clair plutôt qu'en erreur 500.
export function estDoublonUnique(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
