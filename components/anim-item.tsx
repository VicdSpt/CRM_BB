import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Élément de liste avec entrée en cascade (fade + slide-up), décalée selon l'index.
// Le délai est plafonné pour éviter une attente trop longue sur les grandes listes.
// Le mouvement est neutralisé pour `prefers-reduced-motion` (cf. globals.css).
export function AnimItem({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      {children}
    </li>
  );
}
