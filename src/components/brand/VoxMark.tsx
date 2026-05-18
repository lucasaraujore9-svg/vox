// Monograma V (quadrado), pra avatares, ícones de menu, app icon embutido.
// Variantes:
//   - "forest"      → fundo verde forest (padrão sobre claro)
//   - "parchment"   → fundo bege (sobre verde / dark)
//   - "stage"       → fundo stage dark (sobre claro discreto)
//   - "transparent" → sem fundo (uso com bg próprio)

import Image from "next/image";

export type MarkVariant = "forest" | "parchment" | "stage" | "transparent";

interface VoxMarkProps {
  variant?: MarkVariant;
  /** Tamanho do quadrado em px. Default 32. */
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

const SRC: Record<MarkVariant, string> = {
  forest: "/logo/png/vox-mark-forest-128.png",
  parchment: "/logo/png/vox-mark-parchment-128.png",
  stage: "/logo/png/vox-mark-stage-128.png",
  transparent: "/logo/png/vox-mark-transparent-128.png",
};

export function VoxMark({
  variant = "forest",
  size = 32,
  className,
  priority = false,
  alt = "VOX",
}: VoxMarkProps) {
  return (
    <Image
      src={SRC[variant]}
      alt={alt}
      width={size * 2}
      height={size * 2}
      sizes={`${size}px`}
      priority={priority}
      style={{ width: size, height: size, display: "block", borderRadius: "18%" }}
      className={className}
    />
  );
}
