// Bloco visual usado no editor (proto). Real TipTap entra em 031.
// Cada bloco tem barra de cor à esquerda, label, hint e textarea.

"use client";

import { useState } from "react";
import type { BlockType } from "@/lib/mocks/blocks";
import { cn } from "@/lib/utils";

interface SermonBlockProps {
  type: BlockType;
  initialContent?: string;
  number?: number;
  onChange?: (content: string) => void;
  className?: string;
}

export function SermonBlock({
  type,
  initialContent = "",
  number,
  onChange,
  className,
}: SermonBlockProps) {
  const [content, setContent] = useState(initialContent);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <article
      className={cn("relative rounded-xl bg-card p-6 group transition-all", className)}
      style={{
        border: "1px solid var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <span
        className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
        style={{ background: type.color }}
        aria-hidden
      />

      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {number != null ? (
            <span className="vox-mono text-xs text-vox-muted">
              {String(number).padStart(2, "0")}
            </span>
          ) : null}
          <span className="inline-block size-2 rounded-full" style={{ background: type.color }} />
          <p className="vox-eyebrow" style={{ color: type.color }}>
            {type.label}
          </p>
          {!type.visibleInPresentation ? (
            <span className="text-xs text-vox-muted italic">
              (não aparece em apresentação)
            </span>
          ) : null}
        </div>
        <p className="vox-mono text-xs text-vox-muted opacity-0 group-hover:opacity-100 transition-opacity">
          {wordCount} palavras
        </p>
      </header>

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onChange?.(e.target.value);
        }}
        placeholder={type.hint}
        rows={3}
        className={cn(
          "w-full bg-transparent border-0 outline-none resize-none",
          "text-vox-ink placeholder:text-vox-muted",
          "focus-visible:ring-0"
        )}
        style={{
          fontFamily:
            type.id === "texto_biblico" || type.id === "citacao"
              ? "var(--vox-font-display)"
              : "var(--vox-font-ui)",
          fontStyle: type.id === "texto_biblico" ? "italic" : "normal",
          fontSize: type.id === "texto_biblico" ? "var(--vox-text-lg)" : "var(--vox-text-md)",
          lineHeight: type.id === "texto_biblico" ? 1.7 : 1.55,
        }}
      />
    </article>
  );
}
