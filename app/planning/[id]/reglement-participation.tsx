"use client";

import type { MethodePaiement, StatutReglement } from "@prisma/client";
import { marquerPaye, annulerPaiement, reglerAvecPack, annulerPack } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";

const METHODES: Array<[MethodePaiement, string]> = [
  ["ESPECES", "Espèces"],
  ["CB", "CB"],
  ["VIREMENT", "Virement"],
];

const LIBELLE_METHODE: Record<MethodePaiement, string> = {
  ESPECES: "Espèces",
  CB: "CB",
  VIREMENT: "Virement",
};

export function ReglementParticipation({
  participationId,
  statut,
  methode,
  packDisponible,
}: {
  participationId: string;
  statut: StatutReglement;
  methode: MethodePaiement | null;
  packDisponible: boolean;
}) {
  if (statut === "PAYE") {
    return (
      <span className="flex items-center gap-2">
        <span className="text-sm text-green-700">
          Payé{methode ? ` · ${LIBELLE_METHODE[methode]}` : ""}
        </span>
        <form action={annulerPaiement.bind(null, participationId)}>
          <Button type="submit" variant="ghost" size="sm">
            Annuler
          </Button>
        </form>
      </span>
    );
  }

  if (statut === "COUVERT_PAR_PACK") {
    return (
      <span className="flex items-center gap-2">
        <span className="text-sm text-blue-700">Couvert par un pack</span>
        <form action={annulerPack.bind(null, participationId)}>
          <Button type="submit" variant="ghost" size="sm">
            Annuler
          </Button>
        </form>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-1">
      {METHODES.map(([value, label]) => (
        <form key={value} action={marquerPaye.bind(null, participationId, value)}>
          <Button type="submit" variant="outline" size="sm">
            {label}
          </Button>
        </form>
      ))}
      {packDisponible ? (
        <form action={reglerAvecPack.bind(null, participationId)}>
          <Button type="submit" variant="outline" size="sm">
            Pack
          </Button>
        </form>
      ) : null}
    </span>
  );
}
