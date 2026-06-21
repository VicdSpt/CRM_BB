"use client";

import { useActionState } from "react";
import type { SeanceFormState } from "@/lib/planning/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EleveOption = { id: string; prenom: string; nom: string };

type SeanceInitial = {
  type?: "PRIVE" | "COLLECTIF";
  dateHeureDebutLocal?: string; // format datetime-local "YYYY-MM-DDTHH:mm"
  dureeMinutes?: number;
  lieu?: string | null;
  prixReference?: number | string;
  eleveIds?: string[];
};

type Props = {
  action: (prev: SeanceFormState, formData: FormData) => Promise<SeanceFormState>;
  eleves: EleveOption[];
  initial?: SeanceInitial;
  submitLabel: string;
};

export function SeanceForm({ action, eleves, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const selected = new Set(initial?.eleveIds ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={initial?.type ?? "PRIVE"}
          className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
        >
          <option value="PRIVE">Cours privé</option>
          <option value="COLLECTIF">Cours collectif</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateHeureDebut">Date et heure</Label>
        <Input
          id="dateHeureDebut"
          name="dateHeureDebut"
          type="datetime-local"
          defaultValue={initial?.dateHeureDebutLocal}
          required
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="dureeMinutes">Durée (min)</Label>
          <Input
            id="dureeMinutes"
            name="dureeMinutes"
            type="number"
            min={1}
            defaultValue={initial?.dureeMinutes ?? 60}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="prixReference">Prix (€)</Label>
          <Input
            id="prixReference"
            name="prixReference"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.prixReference?.toString() ?? "0"}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lieu">Lieu</Label>
        <Input id="lieu" name="lieu" defaultValue={initial?.lieu ?? ""} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Élèves</legend>
        {eleves.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun élève actif. Ajoutez d&apos;abord un élève.
          </p>
        ) : (
          eleves.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="eleveIds"
                value={e.id}
                defaultChecked={selected.has(e.id)}
              />
              {e.prenom} {e.nom}
            </label>
          ))
        )}
        {state.errors?.eleveIds ? (
          <p className="text-sm text-red-600">{state.errors.eleveIds}</p>
        ) : null}
      </fieldset>

      {state.errors?.dureeMinutes ? (
        <p className="text-sm text-red-600">{state.errors.dureeMinutes}</p>
      ) : null}
      {state.errors?.prixReference ? (
        <p className="text-sm text-red-600">{state.errors.prixReference}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
