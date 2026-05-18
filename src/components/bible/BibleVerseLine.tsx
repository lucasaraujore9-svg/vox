"use client";

// Linha de versículo no leitor. Hover mostra menu de ações:
//   - Copiar referência
//   - Copiar texto + ref
//   - Inserir num esboço (placeholder; conectar quando houver "sermão ativo" no contexto)

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Copy, Link as LinkIcon, FilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BibleVerseLineProps {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  number: number;
  text: string;
}

export function BibleVerseLine({
  bookName,
  chapter,
  number,
  text,
}: BibleVerseLineProps) {
  const [hovered, setHovered] = useState(false);
  const canonical = `${bookName} ${chapter}:${number}`;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(canonical);
      toast.success("Referência copiada", { description: canonical });
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function copyVerse() {
    try {
      await navigator.clipboard.writeText(`"${text}", ${canonical}`);
      toast.success("Versículo copiado", { description: canonical });
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div
      id={`v${number}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group flex items-baseline gap-3 py-1.5 px-2 -mx-2 rounded-md transition-colors",
        "hover:bg-vox-surface-deep/50"
      )}
    >
      <a
        href={`#v${number}`}
        className="vox-mono text-[10px] text-vox-muted pt-1 shrink-0 w-7 text-right hover:text-vox-forest"
        aria-label={`Versículo ${number}`}
      >
        {String(number).padStart(2, "0")}
      </a>
      <p
        className="flex-1 leading-relaxed text-vox-ink"
        style={{
          fontFamily: "var(--vox-font-display)",
          fontSize: "17px",
          lineHeight: 1.65,
        }}
      >
        {text}
      </p>
      <div
        className={cn(
          "shrink-0 transition-opacity",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            className="size-7 inline-flex items-center justify-center rounded-md text-vox-muted hover:text-vox-ink hover:bg-accent"
            aria-label="Ações do versículo"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={copyVerse}>
              <Copy className="size-4 mr-2" />
              Copiar versículo
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={copyReference}>
              <LinkIcon className="size-4 mr-2" />
              Copiar referência
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                window.location.href = `/sermons/new?reference=${encodeURIComponent(canonical)}`;
              }}
            >
              <FilePlus className="size-4 mr-2" />
              Começar sermão daqui
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
