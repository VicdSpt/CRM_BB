"use client";

import { useActionState } from "react";
import { updateProfil } from "@/lib/espace/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { email: string | null; telephone: string | null; adresse: string | null };

export function ProfilForm({ email, telephone, adresse }: Props) {
  const [state, formAction, pending] = useActionState(updateProfil, {});

  const champs = [
    { name: "email", label: "Email", type: "email", valeur: email, requis: true },
    { name: "telephone", label: "Téléphone", type: "tel", valeur: telephone, requis: true },
    { name: "adresse", label: "Adresse", type: "text", valeur: adresse, requis: false },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {champs.map((c) => (
        <div key={c.name} className="flex flex-col gap-1.5">
          <Label htmlFor={c.name}>{c.label}</Label>
          <Input
            id={c.name}
            name={c.name}
            type={c.type}
            defaultValue={c.valeur ?? ""}
            required={c.requis}
          />
          {state.errors?.[c.name] ? (
            <p className="text-sm text-red-600">{state.errors[c.name]}</p>
          ) : null}
        </div>
      ))}
      {state.message ? <p className="text-sm text-emerald-600">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
