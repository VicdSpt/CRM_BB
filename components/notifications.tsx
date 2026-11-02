"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useTheme } from "next-themes";
import { COOKIE_FLASH, type Flash } from "@/lib/flash";

// Notifications en haut de l'écran. Le message flash vient du cookie lu par le layout :
// on l'affiche une seule fois (id unique), puis on efface le cookie.
export function Notifications({ flash }: { flash: Flash | null }) {
  const { resolvedTheme } = useTheme();

  const id = flash?.id;
  const message = flash?.message;
  useEffect(() => {
    if (!id || !message) return;
    toast.success(message, { id });
    document.cookie = `${COOKIE_FLASH}=; Max-Age=0; path=/`;
  }, [id, message]);

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
