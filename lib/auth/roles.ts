import { isActive } from "@/lib/nav";

export type Role = "coach" | "eleve";

export type DecisionRoute = { ok: true } | { redirect: string };

const PAGES_PUBLIQUES = ["/login", "/inscription"];
const ESPACE_ELEVE = "/espace";

const accueil = (role: Role) => (role === "coach" ? "/" : ESPACE_ELEVE);

// Décide, pour le proxy, si un utilisateur peut afficher une page.
// `role === null` couvre le visiteur non connecté ET un jeton émis avant
// l'introduction des rôles : dans les deux cas, on le traite comme déconnecté.
export function routeAutorisee(pathname: string, role: Role | null): DecisionRoute {
  const publique = PAGES_PUBLIQUES.some((p) => isActive(pathname, p));

  if (role === null) {
    return publique ? { ok: true } : { redirect: "/login" };
  }
  if (publique) return { redirect: accueil(role) };

  const dansEspace = isActive(pathname, ESPACE_ELEVE);
  if (role === "eleve" && !dansEspace) return { redirect: ESPACE_ELEVE };
  if (role === "coach" && dansEspace) return { redirect: "/" };
  return { ok: true };
}
