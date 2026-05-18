"use client";

// Pílula compacta abaixo do textarea: mostra a referência detectada, preview do
// versículo (após fetch), e dois actions: "Ver" (popover) e "+ Inserir bloco".

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBibleReference } from "@/hooks/useBibleReference";
import { BIBLE_VERSIONS, type BibleVersionId } from "@/lib/bible/versions";
import { cn } from "@/lib/utils";

interface ReferenceHintProps {
  canonical: string;
  version: BibleVersionId;
  /** Callback ao clicar "+ Inserir bloco", recebe a referência canônica, o texto e a versão escolhida */
  onInsert?: (canonical: string, fullText: string, version: BibleVersionId) => void;
  /** Permite remover/dispensar essa hint */
  onDismiss?: () => void;
  className?: string;
}

export function ReferenceHint({
  canonical,
  version,
  onInsert,
  onDismiss,
  className,
}: ReferenceHintProps) {
  // Versão pode ser sobrescrita inline antes de inserir
  const [chosenVersion, setChosenVersion] = useState<BibleVersionId>(version);
  const { data, loading, error } = useBibleReference(canonical, chosenVersion);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fullText =
    data?.verses?.map((v) => `${v.number}. ${v.text}`).join(" ") ?? "";
  const previewText = data?.verses?.[0]?.text ?? "";
  const chosenAbbrev =
    BIBLE_VERSIONS.find((v) => v.id === chosenVersion)?.abbreviation ?? chosenVersion.toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
        className
      )}
      style={{
        background: "var(--vox-gold-soft)",
        color: "var(--vox-gold)",
        border: "1px solid rgba(180,83,9,0.25)",
      }}
    >
      <span aria-hidden>📖</span>
      <span className="vox-mono font-medium">{canonical}</span>

      {loading ? (
        <span className="opacity-70">…</span>
      ) : error ? (
        <span className="opacity-70 italic">não encontrado</span>
      ) : previewText ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="opacity-70 hover:opacity-100 underline-offset-2 hover:underline truncate max-w-[220px] text-left"
              aria-label="Ver passagem"
            >
              {previewText.slice(0, 50)}
              {previewText.length > 50 ? "…" : ""}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-96 max-h-80 overflow-y-auto"
            style={{
              background: "var(--vox-surface)",
              border: "1px solid var(--vox-whisper)",
            }}
          >
            <p className="vox-ref mb-3">{data?.canonical}</p>
            <div className="space-y-1">
              {data?.verses?.map((v) => (
                <p key={v.number} className="vox-scripture text-sm leading-relaxed">
                  <span className="vox-mono text-vox-muted text-xs mr-1.5">
                    {v.number}
                  </span>
                  {v.text}
                </p>
              ))}
            </div>
            <p className="vox-mono text-xs text-vox-muted mt-3 uppercase">
              {data?.version}
            </p>
          </PopoverContent>
        </Popover>
      ) : null}

      {/* Seletor de versão inline, permite trocar antes de inserir */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="vox-mono text-[10px] px-1.5 py-0.5 rounded-full border border-current opacity-70 hover:opacity-100"
            aria-label="Trocar versão"
            title={`Versão: ${chosenAbbrev}`}
          >
            {chosenAbbrev} ▾
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {BIBLE_VERSIONS.map((v) => (
            <DropdownMenuItem
              key={v.id}
              onSelect={() => setChosenVersion(v.id)}
            >
              <span className="vox-mono mr-2">{v.abbreviation}</span>
              <span className="text-xs text-vox-muted">{v.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {data && onInsert ? (
        <button
          type="button"
          onClick={() => onInsert(canonical, fullText, chosenVersion)}
          className="hover:underline underline-offset-2 font-medium ml-1"
          aria-label="Inserir como bloco de texto bíblico"
        >
          + Inserir
        </button>
      ) : null}

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="opacity-50 hover:opacity-100 ml-0.5"
          aria-label="Dispensar"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
