"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function RechercheEleves() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <Input
      type="search"
      placeholder="Rechercher un élève…"
      defaultValue={params.get("q") ?? ""}
      onChange={(e) => {
        const next = new URLSearchParams(params);
        if (e.target.value) next.set("q", e.target.value);
        else next.delete("q");
        router.replace(`/eleves?${next.toString()}`);
      }}
    />
  );
}
