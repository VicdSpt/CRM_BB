"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const estSombre = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={estSombre ? "Passer en clair" : "Passer en sombre"}
      onClick={() => setTheme(estSombre ? "light" : "dark")}
    >
      {estSombre ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
