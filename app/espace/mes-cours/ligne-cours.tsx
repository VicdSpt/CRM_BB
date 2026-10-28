"use client";

import { useState, useTransition } from "react";
import { annulerReservation } from "@/lib/espace/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LigneCoursProps = {
  seanceId: string;
  date: string;
  heure: string;
  dureeMinutes: number;
  type: "PRIVE" | "COLLECTIF";
  lieu: string | null;
  montant: string;
  reglement: "A_REGLER" | "PAYE" | "COUVERT_PAR_PACK";
  annule: boolean;
  desinscriptionPossible: boolean;
};

const REGLEMENTS = {
  A_REGLER: ["À régler", "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"],
  PAYE: ["Payé", "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"],
  COUVERT_PAR_PACK: ["Pack", "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"],
} as const;

// Une ligne de l'historique de l'élève (cours privé ou collectif).
export function LigneCours(c: LigneCoursProps) {
  const [erreur, setErreur] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [libelle, classe] = REGLEMENTS[c.reglement];

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {c.date} · {c.heure}
        </span>
        {c.annule ? (
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            Annulé
          </span>
        ) : (
          <span className={cn("rounded-full px-2 py-0.5 text-xs", classe)}>{libelle}</span>
        )}
      </div>
      <span className="text-muted-foreground text-sm">
        {[
          c.type === "PRIVE" ? "Cours privé" : "Cours collectif",
          `${c.dureeMinutes} min`,
          c.lieu,
          c.montant,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {c.desinscriptionPossible ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => setErreur((await annulerReservation(c.seanceId)).erreur))
          }
        >
          {pending ? "Désinscription…" : "Me désinscrire"}
        </Button>
      ) : null}
      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
    </li>
  );
}
