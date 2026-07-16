"use client";

import { useActionState, useState } from "react";
import { modifierPack, supprimerPack } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JaugePack } from "@/components/jauge-pack";
import { BoutonSuppression } from "@/components/bouton-suppression";
import { formatEuros } from "@/lib/finances/format";

type Pack = {
  id: string;
  nbSeancesTotal: number;
  nbSeancesRestantes: number;
  montantPaye: string;
  methode: "ESPECES" | "CB";
};

export function PackItem({ pack }: { pack: Pack }) {
  const [edition, setEdition] = useState(false);
  const [state, formAction, pending] = useActionState(modifierPack.bind(null, pack.id), {});

  if (!edition) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="min-w-0 flex-1">
          <JaugePack restantes={pack.nbSeancesRestantes} total={pack.nbSeancesTotal} />
        </div>
        <span className="text-muted-foreground text-sm">{formatEuros(pack.montantPaye)}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEdition(true)}>
            Modifier
          </Button>
          <BoutonSuppression
            action={() => supprimerPack(pack.id)}
            titre="Supprimer ce pack ?"
            description="Les séances déjà couvertes par ce pack repasseront en « à régler » et le paiement d'achat sera retiré."
            size="sm"
          />
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border p-3">
      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`nb-${pack.id}`}>Nb séances</Label>
            <Input
              id={`nb-${pack.id}`}
              name="nbSeancesTotal"
              type="number"
              min={1}
              defaultValue={pack.nbSeancesTotal}
              required
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`montant-${pack.id}`}>Montant (€)</Label>
            <Input
              id={`montant-${pack.id}`}
              name="montantPaye"
              type="number"
              min={0}
              step="0.01"
              defaultValue={pack.montantPaye}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`methode-${pack.id}`}>Méthode</Label>
          <select
            id={`methode-${pack.id}`}
            name="methode"
            defaultValue={pack.methode}
            className="bg-background text-foreground h-9 rounded-md border px-3 text-base md:text-sm"
          >
            <option value="ESPECES">Espèces</option>
            <option value="CB">CB</option>
          </select>
        </div>
        {state.errors?.nbSeancesTotal ? (
          <p className="text-sm text-red-600">{state.errors.nbSeancesTotal}</p>
        ) : null}
        {state.errors?.montantPaye ? (
          <p className="text-sm text-red-600">{state.errors.montantPaye}</p>
        ) : null}
        {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setEdition(false)}>
            Fermer
          </Button>
        </div>
      </form>
    </li>
  );
}
