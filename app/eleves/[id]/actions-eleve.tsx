"use client";

import { setArchiveEleve, deleteEleve } from "@/lib/eleves/actions";
import { Button } from "@/components/ui/button";

export function ActionsEleve({ id, archive }: { id: string; archive: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={() => setArchiveEleve(id, !archive)}>
        <Button type="submit" variant="outline">
          {archive ? "Désarchiver" : "Archiver"}
        </Button>
      </form>
      <form
        action={() => deleteEleve(id)}
        onSubmit={(e) => {
          if (!confirm("Supprimer définitivement cet élève ? Cette action est irréversible.")) {
            e.preventDefault();
          }
        }}
      >
        <Button type="submit" variant="destructive">
          Supprimer
        </Button>
      </form>
    </div>
  );
}
