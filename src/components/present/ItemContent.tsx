// Renderiza o conteúdo de um item (HTML do TipTap ou texto puro legado).
// Aplica estilos via inline style e classe `vox-present-content` que
// uniformiza headings, parágrafos, blockquote, listas, herda fonte/tamanho
// do container.

import { safeHtml } from "@/lib/editor/html";
import { cn } from "@/lib/utils";

interface ItemContentProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "article" | "section";
}

export function ItemContent({
  html,
  className,
  style,
  as: Tag = "div",
}: ItemContentProps) {
  return (
    <Tag
      className={cn("vox-present-content", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: safeHtml(html) }}
    />
  );
}
