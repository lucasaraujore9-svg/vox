"use client";

// Card de uma sessão no editor. Contém todos os itens da sessão + "+ Item" inline.
// Header: título editável + papel (Introdução/Tópico/Conclusão). Painel de sugestões
// vive fora do card, no SermonEditorPanel.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { VOX_BLOCK_TYPES, type BlockTypeId, getBlockType } from "@/lib/mocks/blocks";
import type { SessionNode, SessionRole } from "@/lib/sermons/sessions";
import type { BibleVersionId } from "@/lib/bible/versions";
import { InlineReferenceHints } from "@/components/bible/InlineReferenceHints";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<SessionRole, string> = {
  introducao: "Introdução",
  topico: "Tópico",
  conclusao: "Conclusão",
  livre: "Livre",
};

const ROLE_COLOR: Record<SessionRole, string> = {
  introducao: "var(--vox-forest)",
  topico: "var(--vox-gold)",
  conclusao: "var(--vox-ink)",
  livre: "var(--vox-muted)",
};

interface SessionCardProps {
  session: SessionNode;
  index: number;
  /** Versão bíblica usada pelo autocomplete de referências */
  bibleVersion?: BibleVersionId;
  /** Sugestões do framework para esta sessão (informativo, não bloqueia) */
  suggestions?: {
    present: BlockTypeId[];
    missing: BlockTypeId[];
    extra: BlockTypeId[];
  };
  onTitleChange?: (id: string, title: string) => void;
  onItemContentChange?: (sessionId: string, itemId: string, content: string) => void;
  onItemTypeChange?: (sessionId: string, itemId: string, type: BlockTypeId) => void;
  onAddItem?: (sessionId: string, type: BlockTypeId) => void;
  onRemoveItem?: (sessionId: string, itemId: string) => void;
  onRemoveSession?: (sessionId: string) => void;
  /** Insere um item Texto Bíblico logo APÓS o item indicado */
  onInsertVerseAfter?: (
    sessionId: string,
    afterItemId: string,
    canonical: string,
    fullText: string
  ) => void;
}

export function SessionCard({
  session,
  index,
  bibleVersion = "acf",
  suggestions,
  onTitleChange,
  onItemContentChange,
  onItemTypeChange,
  onAddItem,
  onRemoveItem,
  onRemoveSession,
  onInsertVerseAfter,
}: SessionCardProps) {
  const accent = ROLE_COLOR[session.role];
  return (
    <section
      className="relative rounded-2xl bg-card p-7"
      style={{
        border: "1px solid var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <span
        className="absolute left-0 top-7 bottom-7 w-1 rounded-r"
        style={{ background: accent }}
        aria-hidden
      />

      <header className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="vox-mono text-xs text-vox-muted"
              aria-label="Número da sessão"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <Badge
              variant="outline"
              className="text-xs font-normal"
              style={{ borderColor: accent, color: accent }}
            >
              {ROLE_LABEL[session.role]}
            </Badge>
            {suggestions ? (
              <SuggestionPill
                missingCount={suggestions.missing.length}
                extraCount={suggestions.extra.length}
              />
            ) : null}
          </div>
          <Input
            defaultValue={session.title}
            onBlur={(e) => onTitleChange?.(session.id, e.target.value)}
            className="border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-1"
            style={{
              fontFamily: "var(--vox-font-display)",
              fontWeight: 600,
              fontSize: "var(--vox-text-2xl)",
              letterSpacing: "-0.01em",
              color: "var(--vox-ink)",
            }}
          />
        </div>
        {onRemoveSession ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSession(session.id)}
            className="text-vox-muted hover:text-vox-destructive"
            aria-label="Remover sessão"
          >
            Remover
          </Button>
        ) : null}
      </header>

      {suggestions && suggestions.missing.length > 0 ? (
        <p className="text-xs text-vox-prose mb-5">
          Sugestões do framework pra esta sessão:{" "}
          {suggestions.missing.map((id, idx) => {
            const block = getBlockType(id);
            return (
              <span key={id} className="vox-mono">
                {block?.label ?? id}
                {idx < suggestions.missing.length - 1 ? " · " : ""}
              </span>
            );
          })}
        </p>
      ) : null}

      <div className="space-y-3">
        {session.items.map((item) => {
          const type = getBlockType(item.type);
          if (!type) return null;
          return (
            <SessionItemRow
              key={item.id}
              sessionId={session.id}
              itemId={item.id}
              type={type.id}
              content={item.content}
              bibleVersion={bibleVersion}
              onContentChange={onItemContentChange}
              onTypeChange={onItemTypeChange}
              onRemove={onRemoveItem}
              onInsertVerseAfter={onInsertVerseAfter}
            />
          );
        })}
      </div>

      <AddItemMenu sessionId={session.id} onAdd={onAddItem} />
    </section>
  );
}

function SuggestionPill({
  missingCount,
  extraCount,
}: {
  missingCount: number;
  extraCount: number;
}) {
  if (missingCount === 0 && extraCount === 0) {
    return (
      <span
        className="vox-mono text-xs px-2 py-0.5 rounded-full"
        style={{ background: "var(--vox-forest-soft)", color: "var(--vox-forest)" }}
      >
        ✓ Esqueleto completo
      </span>
    );
  }
  return (
    <span
      className="vox-mono text-xs px-2 py-0.5 rounded-full"
      style={{ background: "var(--vox-gold-soft)", color: "var(--vox-gold)" }}
    >
      {missingCount > 0 ? `${missingCount} sugestão${missingCount > 1 ? "s" : ""}` : null}
      {missingCount > 0 && extraCount > 0 ? " · " : ""}
      {extraCount > 0 ? `${extraCount} extra${extraCount > 1 ? "s" : ""}` : null}
    </span>
  );
}

interface SessionItemRowProps {
  sessionId: string;
  itemId: string;
  type: BlockTypeId;
  content: string;
  bibleVersion?: BibleVersionId;
  onContentChange?: (sessionId: string, itemId: string, content: string) => void;
  onTypeChange?: (sessionId: string, itemId: string, type: BlockTypeId) => void;
  onRemove?: (sessionId: string, itemId: string) => void;
  onInsertVerseAfter?: (
    sessionId: string,
    afterItemId: string,
    canonical: string,
    fullText: string
  ) => void;
}

function SessionItemRow({
  sessionId,
  itemId,
  type,
  content,
  bibleVersion = "acf",
  onContentChange,
  onTypeChange,
  onRemove,
  onInsertVerseAfter,
}: SessionItemRowProps) {
  const [localContent, setLocalContent] = useState(content);
  const blockType = getBlockType(type);
  if (!blockType) return null;
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;

  return (
    <article
      className={cn(
        "relative rounded-lg p-4 group transition-all",
        "bg-[var(--vox-surface-elev)]"
      )}
      style={{
        border: "1px solid var(--vox-whisper)",
      }}
    >
      <span
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r"
        style={{ background: blockType.color }}
        aria-hidden
      />
      <header className="flex items-center justify-between gap-3 mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: blockType.color }}
            />
            <p
              className="vox-eyebrow hover:opacity-70 transition-opacity"
              style={{ color: blockType.color }}
            >
              {blockType.label}
            </p>
            <span className="text-vox-muted text-xs">▾</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
            {VOX_BLOCK_TYPES.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onSelect={() => onTypeChange?.(sessionId, itemId, b.id)}
              >
                <span
                  className="inline-block size-1.5 rounded-full mr-2"
                  style={{ background: b.color }}
                />
                {b.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="vox-mono text-xs text-vox-muted">{wordCount} palavras</span>
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(sessionId, itemId)}
              className="text-xs text-vox-muted hover:text-vox-destructive"
              aria-label="Remover item"
            >
              Remover
            </button>
          ) : null}
        </div>
      </header>

      <textarea
        value={localContent}
        onChange={(e) => {
          setLocalContent(e.target.value);
          onContentChange?.(sessionId, itemId, e.target.value);
        }}
        placeholder={blockType.hint}
        rows={2}
        className="w-full bg-transparent border-0 outline-none resize-none focus-visible:ring-0 text-vox-ink placeholder:text-vox-muted"
        style={{
          fontFamily:
            type === "texto_biblico" || type === "citacao"
              ? "var(--vox-font-display)"
              : "var(--vox-font-ui)",
          fontStyle: type === "texto_biblico" ? "italic" : "normal",
          fontSize: type === "texto_biblico" ? "var(--vox-text-md)" : "var(--vox-text-base)",
          lineHeight: type === "texto_biblico" ? 1.65 : 1.55,
        }}
      />

      {/* Refs bíblicas detectadas no texto — pílulas com preview + inserir */}
      <InlineReferenceHints
        text={localContent}
        version={bibleVersion}
        onInsert={(canonical, fullText) =>
          onInsertVerseAfter?.(sessionId, itemId, canonical, fullText)
        }
      />
    </article>
  );
}

function AddItemMenu({
  sessionId,
  onAdd,
}: {
  sessionId: string;
  onAdd?: (sessionId: string, type: BlockTypeId) => void;
}) {
  return (
    <div className="mt-5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-vox-prose">
            + Item
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          {VOX_BLOCK_TYPES.map((b) => (
            <DropdownMenuItem
              key={b.id}
              onSelect={() => onAdd?.(sessionId, b.id)}
            >
              <span
                className="inline-block size-1.5 rounded-full mr-2"
                style={{ background: b.color }}
              />
              {b.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
