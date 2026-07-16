"use client";

import { useActionState } from "react";
import type { EleveFormState } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnimBloc } from "@/components/anim-item";

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
      <AnimBloc index={0}>
        <Field
          label="Prénom"
          name="prenom"
          defaultValue={initial?.prenom}
          error={state.errors?.prenom}
          required
        />
      </AnimBloc>
      <AnimBloc index={1}>
        <Field
          label="Nom"
          name="nom"
          defaultValue={initial?.nom}
          error={state.errors?.nom}
          required
        />
      </AnimBloc>
      <AnimBloc index={2}>
        <Field
          label="Téléphone"
          name="telephone"
          defaultValue={initial?.telephone ?? ""}
          error={state.errors?.telephone}
        />
      </AnimBloc>
      <AnimBloc index={3}>
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          error={state.errors?.email}
        />
      </AnimBloc>
      <AnimBloc index={4}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={4} />
        </div>
      </AnimBloc>
      <AnimBloc index={5}>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </AnimBloc>
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
