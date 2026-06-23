import type { ReactNode } from "react";

// Re-monté à chaque navigation : produit un fondu doux d'entrée de page.
// (Le mouvement est coupé pour `prefers-reduced-motion` via globals.css.)
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-in fade-in duration-300 ease-out">{children}</div>;
}
