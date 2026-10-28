import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Garde de toutes les pages et Server Actions coach : vérifie le RÔLE,
// pas seulement l'existence d'une session (un élève connecté a aussi une session).
export async function requireCoach() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || !role) redirect("/login");
  if (role !== "coach") redirect("/espace");
  return session;
}
