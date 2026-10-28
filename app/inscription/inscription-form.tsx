"use client";

import { useActionState } from "react";
import { inscrireEleve } from "@/lib/eleves/inscription-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CHAMPS = [
  { name: "prenom", label: "Prénom", type: "text", autoComplete: "given-name" },
  { name: "nom", label: "Nom", type: "text", autoComplete: "family-name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "telephone", label: "Téléphone", type: "tel", autoComplete: "tel" },
  { name: "motDePasse", label: "Mot de passe", type: "password", autoComplete: "new-password" },
] as const;

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState(inscrireEleve, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {CHAMPS.map((c) => (
        <div key={c.name} className="flex flex-col gap-1.5">
          <Label htmlFor={c.name}>{c.label}</Label>
          <Input
            id={c.name}
            name={c.name}
            type={c.type}
            autoComplete={c.autoComplete}
            minLength={c.name === "motDePasse" ? 8 : undefined}
            required
          />
          {state.errors?.[c.name] ? (
            <p className="text-sm text-red-600">{state.errors[c.name]}</p>
          ) : null}
        </div>
      ))}
      {state.message ? <p className="text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
