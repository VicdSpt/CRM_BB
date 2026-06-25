"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground text-sm">
        Quelque chose s&apos;est mal passé. Réessaie, ou reviens à l&apos;accueil.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Accueil
        </Button>
      </div>
    </main>
  );
}
