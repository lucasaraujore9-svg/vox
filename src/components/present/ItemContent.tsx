// Renderiza o conteúdo de um item (HTML do TipTap ou texto puro legado).
// Aplica estilos via inline style e classe `vox-present-content` que
// uniformiza headings, parágrafos, blockquote, listas, herda fonte/tamanho
// do container.

import { safeHtml, withoutInlineColors } from "@/lib/editor/html";
import { cn } from "@/lib/utils";

interface ItemContentProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "article" | "section";
  /** Em fundo escuro, descarta a cor inline do editor (escolhida no claro). */
  onDarkSurface?: boolean;
}

export function ItemContent({
  html,
  className,
  style,
  as: Tag = "div",
  onDarkSurface = false,
}: ItemContentProps) {
  const safe = safeHtml(html);
  return (
    <Tag
      className={cn("vox-present-content", className)}
      style={style}
      dangerouslySetInnerHTML={{
        __html: onDarkSurface ? withoutInlineColors(safe) : safe,
      }}
    />
  );
}
