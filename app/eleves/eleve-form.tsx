"use client";

import { useActionState } from "react";
import type { EleveFormState } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EleveInitial = {
  prenom?: string;
  nom?: string;
  telephone?: string | null;
  email?: string | null;
  notes?: string | null;
};

type Props = {
  action: (prev: EleveFormState, formData: FormData) => Promise<EleveFormState>;
  initial?: EleveInitial;
  submitLabel: string;
};

export function EleveForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label="Prénom"
        name="prenom"
        defaultValue={initial?.prenom}
        error={state.errors?.prenom}
        required
      />
      <Field
        label="Nom"
        name="nom"
        defaultValue={initial?.nom}
        error={state.errors?.nom}
        required
      />
      <Field
        label="Téléphone"
        name="telephone"
        defaultValue={initial?.telephone ?? ""}
        error={state.errors?.telephone}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={initial?.email ?? ""}
        error={state.errors?.email}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
