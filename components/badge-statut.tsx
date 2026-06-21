import { libelleStatut } from "@/lib/planning/libelles";

type Statut = "PLANIFIEE" | "REALISEE" | "ANNULEE";

const CLASSES: Record<Statut, string> = {
  PLANIFIEE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  REALISEE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ANNULEE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function BadgeStatut({ statut }: { statut: Statut }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[statut]}`}>
      {libelleStatut(statut)}
    </span>
  );
}
