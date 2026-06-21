import { initiales } from "@/lib/eleves/initiales";
import { cn } from "@/lib/utils";

export function Initiales({
  prenom,
  nom,
  className,
}: {
  prenom: string;
  nom: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
      aria-hidden="true"
    >
      {initiales(prenom, nom)}
    </span>
  );
}
