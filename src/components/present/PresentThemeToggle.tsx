"use client";

// Alternador claro/escuro das telas de apresentação.
// Claro é o padrão; escuro serve para sala apagada.

import { Moon, Sun } from "lucide-react";
import {
  setPresentTheme,
  type PresentSurface,
  type PresentTheme,
} from "@/lib/presenter/theme";

export function PresentThemeToggle({
  theme,
  surface,
}: {
  theme: PresentTheme;
  surface: PresentSurface;
}) {
  const goingDark = theme === "claro";
  return (
    <button
      type="button"
      onClick={() => setPresentTheme(goingDark ? "escuro" : "claro")}
      title={goingDark ? "Fundo escuro" : "Fundo claro"}
      aria-label={goingDark ? "Usar fundo escuro" : "Usar fundo claro"}
      className="size-8 rounded-md flex items-center justify-center transition-colors"
      style={{
        color: surface.muted,
        border: `1px solid ${surface.border}`,
      }}
    >
      {goingDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
