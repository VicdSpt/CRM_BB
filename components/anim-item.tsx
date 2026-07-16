"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// Fade-up d'apparition (Motion) : léger, ressort naturel, cascade par index.
// Le délai est plafonné pour éviter une attente trop longue sur les grandes listes.
// `useReducedMotion` : le CSS global ne neutralise pas les animations pilotées
// en JS, donc on désactive le mouvement ici quand l'utilisateur le demande.
const ENTREE = { opacity: 0, y: 14 };
const VISIBLE = { opacity: 1, y: 0 };

function transitionEntree(index: number) {
  return {
    delay: Math.min(index, 12) * 0.045,
    duration: 0.45,
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

// Élément de liste (li) en cascade.
export function AnimItem({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      className={className}
      initial={reduceMotion ? false : ENTREE}
      animate={VISIBLE}
      transition={transitionEntree(index)}
    >
      {children}
    </motion.li>
  );
}

// Bloc/section de page en fade-up, avec le même rythme que les listes.
export function AnimBloc({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : ENTREE}
      animate={VISIBLE}
      transition={transitionEntree(index)}
    >
      {children}
    </motion.div>
  );
}
