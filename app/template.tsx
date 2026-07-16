"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Re-monté à chaque navigation : fondu doux d'entrée de page (Motion).
// Le fade-up des contenus est porté par AnimItem/AnimBloc ; ici on reste
// sur un simple fondu pour ne pas cumuler deux glissements.
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
