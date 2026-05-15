"use client";

// Pílula compacta abaixo do textarea: mostra a referência detectada, preview do
// versículo (após fetch), e dois actions: "Ver" (popover) e "+ Inserir bloco".

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBibleReference } from "@/hooks/useBibleReference";
import type { BibleVersionId } from "@/lib/bible/versions";
import { cn } from "@/lib/utils";

interface ReferenceHintProps {
  canonical: string;
  version: BibleVersionId;
  /** Callback ao clicar "+ Inserir bloco" — recebe a referência canônica e o texto completo */
  onInsert?: (canonical: string, fullText: string) => void;
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
  const { data, loading, error } = useBibleReference(canonical, version);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fullText =
    data?.verses?.map((v) => `${v.number}. ${v.text}`).join(" ") ?? "";
  const previewText = data?.verses?.[0]?.text ?? "";

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

      {data && onInsert ? (
        <button
          type="button"
          onClick={() => onInsert(canonical, fullText)}
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
