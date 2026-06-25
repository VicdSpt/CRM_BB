import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-primary text-5xl font-bold">404</p>
      <h1 className="text-xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground text-sm">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Button render={<Link href="/" />}>Retour à l&apos;accueil</Button>
    </main>
  );
}
