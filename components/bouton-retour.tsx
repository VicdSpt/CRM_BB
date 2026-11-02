import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Retour vers la page précédente du menu : un vrai bouton (bordure, chevron, zone de
// clic confortable au doigt) plutôt qu'un petit lien gris.
export function BoutonRetour({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link href={href} />}
      className="h-9 gap-1 self-start rounded-full pr-4 pl-2.5"
    >
      <ChevronLeft className="size-4" />
      {children}
    </Button>
  );
}
