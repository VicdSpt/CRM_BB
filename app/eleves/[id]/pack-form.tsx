"use client";

import { useActionState } from "react";
import { creerPack } from "@/lib/finances/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PackForm({ eleveId }: { eleveId: string }) {
  const action = creerPack.bind(null, eleveId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border p-3">
      <p className="text-sm font-medium">Nouveau pack</p>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="nbSeancesTotal">Nb séances</Label>
          <Input
            id="nbSeancesTotal"
            name="nbSeancesTotal"
            type="number"
            min={1}
            defaultValue={10}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="montantPaye">Montant (€)</Label>
          <Input id="montantPaye" name="montantPaye" type="number" min={0} step="0.01" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="methode">Méthode</Label>
        <select
          id="methode"
          name="methode"
          defaultValue="ESPECES"
          className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
        >
          <option value="ESPECES">Espèces</option>
          <option value="CB">CB</option>
        </select>
      </div>
      {state.errors?.montantPaye ? (
        <p className="text-sm text-red-600">{state.errors.montantPaye}</p>
      ) : null}
      {state.errors?.nbSeancesTotal ? (
        <p className="text-sm text-red-600">{state.errors.nbSeancesTotal}</p>
      ) : null}
      {state.message ? <p className="text-sm text-green-700">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le pack"}
      </Button>
    </form>
  );
}
