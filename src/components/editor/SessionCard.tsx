"use client";

// Sessão dentro da "folha branca" do editor. Sem cards individuais por item:
// cada item é uma área de texto rica (TipTap) com label de tipo em hover.
// A barra de cor à esquerda fica no nível da SESSÃO, marcando o tópico.
//
// Modo `minimal` (folha em branco, framework=livre): esconde badge de papel,
// dropdown de tipo, sugestões. Vira mesmo um doc corrido.

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
import { RichTextItem } from "@/components/editor/RichTextItem";
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
  bibleVersion?: BibleVersionId;
  suggestions?: {
    present: BlockTypeId[];
    missing: BlockTypeId[];
    extra: BlockTypeId[];
  };
  /** Modo "folha em branco": esconde badges, dropdowns de tipo, sugestões. */
  minimal?: boolean;
  /** Primeira sessão da página? Usado para esconder o separador superior. */
  isFirst?: boolean;
  /** Última sessão? Usado para desabilitar o botão "mover pra baixo". */
  isLast?: boolean;
  onTitleChange?: (id: string, title: string) => void;
  onItemContentChange?: (sessionId: string, itemId: string, content: string) => void;
  onItemTypeChange?: (sessionId: string, itemId: string, type: BlockTypeId) => void;
  onAddItem?: (sessionId: string, type: BlockTypeId) => void;
  onRemoveItem?: (sessionId: string, itemId: string) => void;
  onRemoveSession?: (sessionId: string) => void;
  onMoveSession?: (sessionId: string, direction: "up" | "down") => void;
  onMoveItem?: (
    sessionId: string,
    itemId: string,
    direction: "up" | "down"
  ) => void;
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
  minimal = false,
  isFirst = false,
  isLast = false,
  onTitleChange,
  onItemContentChange,
  onItemTypeChange,
  onAddItem,
  onRemoveItem,
  onRemoveSession,
  onMoveSession,
  onMoveItem,
  onInsertVerseAfter,
}: SessionCardProps) {
  const accent = ROLE_COLOR[session.role];

  return (
    <section className={cn("group relative py-4", !isFirst && "mt-16")}>
      {/* Barra vertical de cor à esquerda — abraça o conteúdo do section,
         com 16px de respiro topo/baixo (py-4) e 16px de distância até o texto. */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: accent }}
        aria-hidden
      />

      <header className="flex items-start justify-between gap-3 mb-3 pl-[19px]">
        <div className="flex-1 min-w-0">
          {!minimal ? (
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="vox-mono text-xs text-vox-muted">
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
          ) : null}
          {!minimal || session.title || index > 0 ? (
            <Input
              defaultValue={session.title}
              onBlur={(e) => onTitleChange?.(session.id, e.target.value)}
              placeholder={minimal ? "Tópico (opcional)" : "Título da sessão"}
              className="border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-0.5"
              style={{
                fontFamily: "var(--vox-font-display)",
                fontWeight: 600,
                fontSize: "var(--vox-text-2xl)",
                letterSpacing: "-0.01em",
                color: "var(--vox-ink)",
              }}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity -mr-2">
          {onMoveSession ? (
            <>
              <button
                type="button"
                onClick={() => onMoveSession(session.id, "up")}
                disabled={isFirst}
                className="size-7 inline-flex items-center justify-center text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-vox-whisper/40"
                aria-label="Mover sessão para cima"
                title="Mover sessão para cima"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveSession(session.id, "down")}
                disabled={isLast}
                className="size-7 inline-flex items-center justify-center text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-vox-whisper/40"
                aria-label="Mover sessão para baixo"
                title="Mover sessão para baixo"
              >
                ↓
              </button>
            </>
          ) : null}
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
        </div>
      </header>

      {!minimal && suggestions && suggestions.missing.length > 0 ? (
        <p className="text-xs text-vox-prose mb-4 pl-[19px]">
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

      <div className="space-y-4 pl-[19px]">
        {session.items.map((item, itemIdx) => {
          const type = getBlockType(item.type);
          if (!type) return null;
          return (
            <SessionItemRow
              key={item.id}
              sessionId={session.id}
              itemId={item.id}
              type={type.id}
              content={item.content}
              label={item.label}
              hint={item.hint}
              bibleVersion={bibleVersion}
              minimal={minimal}
              isFirstItem={itemIdx === 0}
              isLastItem={itemIdx === session.items.length - 1}
              onContentChange={onItemContentChange}
              onTypeChange={onItemTypeChange}
              onRemove={onRemoveItem}
              onMove={onMoveItem}
              onInsertVerseAfter={onInsertVerseAfter}
            />
          );
        })}
      </div>

      {!minimal ? (
        <div className="pl-[19px]">
          <AddItemMenu sessionId={session.id} onAdd={onAddItem} />
        </div>
      ) : (
        <div className="pl-[19px] mt-3">
          {onAddItem ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-vox-muted hover:text-vox-prose px-0 h-auto"
              onClick={() => onAddItem(session.id, "notas_pessoais")}
            >
              + parágrafo
            </Button>
          ) : null}
        </div>
      )}
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
  /** Rótulo idiomático do framework (ex: "O Gancho"). Substitui o label do tipo. */
  label?: string;
  /** Placeholder específico do framework. Substitui o hint do tipo. */
  hint?: string;
  bibleVersion?: BibleVersionId;
  /** Modo folha em branco — sem header de tipo */
  minimal?: boolean;
  /** Posição do item na sessão — usado para desabilitar mover quando nas pontas. */
  isFirstItem?: boolean;
  isLastItem?: boolean;
  onContentChange?: (sessionId: string, itemId: string, content: string) => void;
  onTypeChange?: (sessionId: string, itemId: string, type: BlockTypeId) => void;
  onRemove?: (sessionId: string, itemId: string) => void;
  onMove?: (sessionId: string, itemId: string, direction: "up" | "down") => void;
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
  label,
  hint,
  bibleVersion = "acf",
  minimal = false,
  isFirstItem = false,
  isLastItem = false,
  onContentChange,
  onTypeChange,
  onRemove,
  onMove,
  onInsertVerseAfter,
}: SessionItemRowProps) {
  const [localContent, setLocalContent] = useState(content);
  const blockType = getBlockType(type);
  if (!blockType) return null;

  const isScripture = type === "texto_biblico" || type === "citacao";
  const displayLabel = label ?? blockType.label;
  const placeholderText = minimal ? "Comece a escrever…" : (hint ?? blockType.hint);

  return (
    <article className="relative group">
      {!minimal ? (
        <header className="flex items-center justify-between gap-3 mb-1.5">
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
                {displayLabel}
              </p>
              {label && label !== blockType.label ? (
                <span
                  className="vox-mono text-[10px] text-vox-muted"
                  title={`Tipo: ${blockType.label}`}
                >
                  · {blockType.label}
                </span>
              ) : null}
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

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMove ? (
              <>
                <button
                  type="button"
                  onClick={() => onMove(sessionId, itemId, "up")}
                  disabled={isFirstItem}
                  className="size-6 inline-flex items-center justify-center text-xs text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-vox-whisper/40"
                  aria-label="Mover item para cima"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(sessionId, itemId, "down")}
                  disabled={isLastItem}
                  className="size-6 inline-flex items-center justify-center text-xs text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-vox-whisper/40"
                  aria-label="Mover item para baixo"
                  title="Mover para baixo"
                >
                  ↓
                </button>
              </>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(sessionId, itemId)}
                className="text-xs text-vox-muted hover:text-vox-destructive px-1"
                aria-label="Remover item"
              >
                Remover
              </button>
            ) : null}
          </div>
        </header>
      ) : null}

      <RichTextItem
        initialContent={localContent}
        placeholder={placeholderText}
        variant={isScripture ? "scripture" : "default"}
        bibleVersion={bibleVersion}
        onChange={(html) => {
          setLocalContent(html);
          onContentChange?.(sessionId, itemId, html);
        }}
      />

      {/* Refs bíblicas detectadas no texto */}
      <InlineReferenceHints
        text={localContent}
        version={bibleVersion}
        onInsert={(canonical, fullText) =>
          onInsertVerseAfter?.(sessionId, itemId, canonical, fullText)
        }
      />

      {minimal && (onRemove || onMove) ? (
        <div className="absolute -right-2 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMove ? (
            <>
              <button
                type="button"
                onClick={() => onMove(sessionId, itemId, "up")}
                disabled={isFirstItem}
                className="size-5 inline-flex items-center justify-center text-xs text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded"
                aria-label="Mover parágrafo para cima"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(sessionId, itemId, "down")}
                disabled={isLastItem}
                className="size-5 inline-flex items-center justify-center text-xs text-vox-muted hover:text-vox-ink disabled:opacity-30 disabled:cursor-not-allowed rounded"
                aria-label="Mover parágrafo para baixo"
              >
                ↓
              </button>
            </>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(sessionId, itemId)}
              className="text-xs text-vox-muted hover:text-vox-destructive"
              aria-label="Remover parágrafo"
            >
              ✕
            </button>
          ) : null}
        </div>
      ) : null}
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
    <div className="mt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-vox-prose px-0 h-auto">
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
