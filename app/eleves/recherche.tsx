"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function RechercheEleves() {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="search"
        placeholder="Rechercher un élève…"
        defaultValue={params.get("q") ?? ""}
        className="pl-9"
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("q", e.target.value);
          else next.delete("q");
          router.replace(`/eleves?${next.toString()}`);
        }}
      />
    </div>
  );
}
