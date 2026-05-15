// Wordmark VOX completo (palavra "VOX" com punctum).
// Usa next/image apontando pros PNGs em /public/logo/png/.
// Variantes:
//   - "default"  → wordmark sobre parchment (header padrão)
//   - "dark"     → wordmark sobre stage (modo apresentação)
//   - "gold"     → uso cerimonial restrito (capa, certificado)
//   - "mono"     → impressão 1 cor

import Image from "next/image";
import { cn } from "@/lib/utils";

export type WordmarkVariant = "default" | "dark" | "gold" | "mono";

interface VoxWordmarkProps {
  variant?: WordmarkVariant;
  /** Altura visual em px (largura é auto). Default 28. */
  height?: number;
  className?: string;
  priority?: boolean;
}

const SRC: Record<WordmarkVariant, string> = {
  default: "/logo/png/vox-wordmark-640.png",
  dark: "/logo/png/vox-wordmark-dark-640.png",
  gold: "/logo/png/vox-wordmark-gold-640.png",
  mono: "/logo/png/vox-wordmark-mono-640.png",
};

// Proporção do wordmark exportado (aprox 2.5:1).
const ASPECT_RATIO = 2.5;

export function VoxWordmark({
  variant = "default",
  height = 28,
  className,
  priority = false,
}: VoxWordmarkProps) {
  const width = Math.round(height * ASPECT_RATIO);
  return (
    <Image
      src={SRC[variant]}
      alt="VOX"
      width={width * 2} // 2x source para retina
      height={height * 2}
      sizes={`${width}px`}
      priority={priority}
      style={{
        height,
        width: "auto",
        display: "block",
      }}
      className={className}
    />
  );
}
