import { isActive } from "@/lib/nav";

export type Role = "coach" | "eleve";

export type DecisionRoute = { ok: true } | { redirect: string };

const PAGES_PUBLIQUES = ["/login", "/inscription"];
const ESPACE_ELEVE = "/espace";

export function accueilPour(role: Role): string {
  return role === "coach" ? "/" : ESPACE_ELEVE;
}
const accueil = accueilPour;

const estPublique = (pathname: string) => PAGES_PUBLIQUES.some((p) => isActive(pathname, p));

// Coquille (menu) à afficher. Elle dépend du RÔLE de la session, pas de l'URL :
// après la redirection d'une action serveur, l'URL affichée peut rester « / »
// alors qu'un élève est connecté.
export function coquillePour(role: Role | null, pathname: string): "aucune" | "coach" | "eleve" {
  if (estPublique(pathname) || role === null) return "aucune";
  return role;
}

// Décide, pour le proxy, si un utilisateur peut afficher une page.
// `role === null` couvre le visiteur non connecté ET un jeton émis avant
// l'introduction des rôles : dans les deux cas, on le traite comme déconnecté.
export function routeAutorisee(pathname: string, role: Role | null): DecisionRoute {
  const publique = estPublique(pathname);

  if (role === null) {
    return publique ? { ok: true } : { redirect: "/login" };
  }
  if (publique) return { redirect: accueil(role) };

  const dansEspace = isActive(pathname, ESPACE_ELEVE);
  if (role === "eleve" && !dansEspace) return { redirect: ESPACE_ELEVE };
  if (role === "coach" && dansEspace) return { redirect: "/" };
  return { ok: true };
}
