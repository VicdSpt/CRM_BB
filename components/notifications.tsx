"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useTheme } from "next-themes";
import { COOKIE_FLASH, type Flash } from "@/lib/flash";

// Notifications en haut de l'écran. Le message flash vient du cookie lu par le layout :
// on l'affiche une seule fois (id unique), puis on efface le cookie.
export function Notifications({ flash }: { flash: Flash | null }) {
  const { resolvedTheme } = useTheme();

  const id = flash?.id;
  const ton = flash?.ton;
  const message = flash?.message;
  useEffect(() => {
    if (!id || !message) return;
    // Vert pour un succès, rouge pour une suppression ou une annulation.
    (ton === "alerte" ? toast.error : toast.success)(message, { id });
    document.cookie = `${COOKIE_FLASH}=; Max-Age=0; path=/`;
  }, [id, ton, message]);

  return (
    <Toaster
      position="top-center"
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      icons={{
        success: <Check className="size-3.5" strokeWidth={3} />,
        error: <X className="size-3.5" strokeWidth={3} />,
      }}
      // Style maison plutôt que les aplats de sonner : dégradé léger de la couleur, fond
      // translucide avec flou, halo coloré et pastille ronde pour l'icône.
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group relative flex w-full items-center gap-3 rounded-2xl border py-3 pr-10 pl-3 text-sm font-medium shadow-lg backdrop-blur-md",
          icon: "flex size-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
          title: "leading-snug",
          // « ! » : sonner impose un fond gris au bouton en thème sombre (règle très précise).
          closeButton:
            "absolute top-1/2 right-2 left-auto flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0! bg-transparent! text-current! opacity-60 transition-opacity hover:opacity-100 [&_svg]:size-3.5",
          success:
            "border-emerald-500/25 bg-linear-to-br from-emerald-50/95 via-white/90 to-emerald-100/85 text-emerald-950 shadow-emerald-600/15 dark:border-emerald-400/20 dark:from-emerald-950/90 dark:via-neutral-900/90 dark:to-emerald-900/70 dark:text-emerald-50 dark:shadow-emerald-950/40 [&_[data-icon]]:bg-linear-to-br [&_[data-icon]]:from-emerald-400 [&_[data-icon]]:to-emerald-600",
          error:
            "border-red-500/25 bg-linear-to-br from-red-50/95 via-white/90 to-red-100/85 text-red-950 shadow-red-600/15 dark:border-red-400/20 dark:from-red-950/90 dark:via-neutral-900/90 dark:to-red-900/70 dark:text-red-50 dark:shadow-red-950/40 [&_[data-icon]]:bg-linear-to-br [&_[data-icon]]:from-red-400 [&_[data-icon]]:to-red-600",
        },
      }}
    />
  );
}
