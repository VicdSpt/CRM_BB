import { redirect } from "next/navigation";
import type { Eleve } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { etatAccesEleve } from "./acces-eleve";

// Session élève + fiche relue en base, sans redirection selon le statut
// (utilisé par la page d'attente, qui affiche « en attente » ou « inactif »).
export async function getEleveSession(): Promise<{ session: Session; eleve: Eleve | null }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "eleve") redirect("/login");
  const eleve = await prisma.eleve.findUnique({ where: { id: session.user.id } });
  return { session, eleve };
}

// Garde des pages et Server Actions élève : réservée aux comptes VALIDÉS.
// Tout autre état (en attente, refusé, archivé) est renvoyé vers la page d'attente.
export async function requireEleve(): Promise<{ session: Session; eleve: Eleve }> {
  const { session, eleve } = await getEleveSession();
  if (!eleve || etatAccesEleve(eleve) !== "valide") redirect("/espace/attente");
  return { session, eleve };
}
