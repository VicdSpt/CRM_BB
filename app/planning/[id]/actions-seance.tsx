"use client";

import { setStatutSeance, deleteSeance, dupliquerSeance } from "@/lib/planning/actions";
import { Button } from "@/components/ui/button";
import { BoutonSuppression } from "@/components/bouton-suppression";

export function ActionsSeance({
  id,
  statut,
}: {
  id: string;
  statut: "PLANIFIEE" | "REALISEE" | "ANNULEE";
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <form action={() => setStatutSeance(id, "REALISEE")}>
          <Button type="submit" variant={statut === "REALISEE" ? "default" : "outline"} size="sm">
            Réalisée
          </Button>
        </form>
        <form action={() => setStatutSeance(id, "ANNULEE")}>
          <Button type="submit" variant={statut === "ANNULEE" ? "default" : "outline"} size="sm">
            Annulée
          </Button>
        </form>
        <form action={() => setStatutSeance(id, "PLANIFIEE")}>
          <Button type="submit" variant={statut === "PLANIFIEE" ? "default" : "outline"} size="sm">
            Planifiée
          </Button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2">
        <form action={() => dupliquerSeance(id)}>
          <Button type="submit" variant="outline" size="sm">
            Dupliquer (semaine suivante)
          </Button>
        </form>
        <BoutonSuppression
          action={() => deleteSeance(id)}
          titre="Supprimer cette séance ?"
          description="Cette action est irréversible : la séance et ses participations seront supprimées."
          label="Supprimer la séance"
          size="sm"
        />
      </div>
    </div>
  );
}
