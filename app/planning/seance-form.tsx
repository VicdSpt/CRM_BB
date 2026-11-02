"use client";

import { useActionState, useState } from "react";
import type { SeanceFormState } from "@/lib/planning/actions";
import { CAPACITE_PAR_DEFAUT } from "@/lib/planning/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoixDateHeure } from "./choix-date-heure";

type EleveOption = { id: string; prenom: string; nom: string };

type SeanceInitial = {
  type?: "PRIVE" | "COLLECTIF";
  dateHeureDebutLocal?: string; // format datetime-local "YYYY-MM-DDTHH:mm"
  dureeMinutes?: number;
  lieu?: string | null;
  prixReference?: number | string;
  capacite?: number;
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
  const [type, setType] = useState(initial?.type ?? "PRIVE");
  const [erreurDate, setErreurDate] = useState<string>();
  const collectif = type === "COLLECTIF";

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
      // Le jour et l'heure sont choisis par boutons : on vérifie qu'ils le sont avant l'envoi.
      onSubmit={(e) => {
        const manque = !new FormData(e.currentTarget).get("dateHeureDebut");
        setErreurDate(manque ? "Choisis un jour et une heure." : undefined);
        if (manque) e.preventDefault();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "PRIVE" | "COLLECTIF")}
          className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
        >
          <option value="PRIVE">Cours privé</option>
          <option value="COLLECTIF">Cours collectif</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Date et heure</span>
        <ChoixDateHeure
          name="dateHeureDebut"
          valeurInitiale={initial?.dateHeureDebutLocal}
          erreur={erreurDate ?? state.errors?.dateHeureDebut}
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

      {collectif ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capacite">Places</Label>
          <Input
            id="capacite"
            name="capacite"
            type="number"
            min={1}
            defaultValue={initial?.capacite ?? CAPACITE_PAR_DEFAUT}
          />
          <p className="text-muted-foreground text-xs">
            Les élèves réservent eux-mêmes leur place depuis leur espace.
          </p>
          {state.errors?.capacite ? (
            <p className="text-sm text-red-600">{state.errors.capacite}</p>
          ) : null}
        </div>
      ) : null}

      {/* Cours privé : un seul élève, choisi ici. Cours collectif : les élèves réservent eux-mêmes. */}
      {collectif ? null : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eleveId">Élève</Label>
          {eleves.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun élève actif. Ajoutez d&apos;abord un élève.
            </p>
          ) : (
            <select
              id="eleveId"
              name="eleveId"
              defaultValue={initial?.eleveIds?.[0] ?? ""}
              className="bg-background text-foreground h-9 rounded-md border px-3 text-sm"
            >
              <option value="" disabled>
                Choisir un élève
              </option>
              {eleves.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.prenom} {e.nom}
                </option>
              ))}
            </select>
          )}
          {state.errors?.eleveIds ? (
            <p className="text-sm text-red-600">{state.errors.eleveIds}</p>
          ) : null}
        </div>
      )}

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
