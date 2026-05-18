"use client";

// Editor de sermão com sessões. Wraps SessionCard com estado local + "+ Sessão"
// + reordering simples (up/down). Faz auto-save offline-first: salva no Supabase
// e, se a rede falhar, persiste no IndexedDB pra sync quando voltar online.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionCard } from "@/components/editor/SessionCard";
import {
  adviseSession,
  type SermonContent,
  type SessionNode,
  type SessionRole,
} from "@/lib/sermons/sessions";
import { getBlockType, type BlockTypeId } from "@/lib/mocks/blocks";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import type { BibleVersionId } from "@/lib/bible/versions";
import { useAutoSave, type AutoSaveStatus } from "@/hooks/useAutoSave";
import { createClient } from "@/lib/supabase/client";
import { getPending } from "@/lib/offline/db";

interface SermonEditorProps {
  /** ID do sermão no Supabase — necessário pra auto-save. Quando omitido, o editor opera só no estado local. */
  sermonId?: string;
  framework: FrameworkId;
  initialContent: SermonContent;
  /** Versão bíblica usada pelo autocomplete (default acf) */
  bibleVersion?: BibleVersionId;
  onChange?: (content: SermonContent) => void;
}

const STATUS_LABEL: Record<AutoSaveStatus, string> = {
  idle: "Salvo",
  dirty: "Editando…",
  saving: "Salvando…",
  saved: "Salvo",
  offline: "Salvo localmente · sincroniza quando voltar online",
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function SermonEditor({
  sermonId,
  framework,
  initialContent,
  bibleVersion = "acf",
  onChange,
}: SermonEditorProps) {
  const [content, setContent] = useState<SermonContent>(initialContent);
  const [recoveredFromOffline, setRecoveredFromOffline] = useState(false);

  // Recupera conteúdo pendente do IndexedDB no mount. Se houver, ele é mais
  // novo que o vindo do servidor (sync ainda não rodou) — preferi-lo evita
  // que um reload em transição offline→online apague o que foi escrito.
  useEffect(() => {
    if (!sermonId) return;
    let cancelled = false;
    (async () => {
      try {
        const pending = await getPending(sermonId);
        if (cancelled || !pending) return;
        const payload = pending.payload as Partial<SermonContent>;
        if (!payload || !Array.isArray(payload.sessions)) return;
        // Só sobrescreve se o payload diferir do que veio do servidor —
        // evita um set redundante que poderia limpar foco do editor.
        const restored: SermonContent = { sessions: payload.sessions };
        const same =
          JSON.stringify(restored) === JSON.stringify(initialContent);
        if (same) return;
        setContent(restored);
        setRecoveredFromOffline(true);
        onChange?.(restored);
      } catch {
        // IDB indisponível — segue com o initialContent normal.
      }
    })();
    return () => {
      cancelled = true;
    };
    // initialContent é capturado uma vez no mount via state inicial; não
    // queremos re-rodar este efeito a cada re-render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermonId]);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const save = useCallback(
    async (next: SermonContent) => {
      if (!sermonId || !supabase) return;
      // SermonContent é um JSON serializável (sessions + items); cast pra
      // Json esperado pela coluna jsonb sem perder tipo no editor.
      const payload = JSON.parse(JSON.stringify(next));
      const wordCount = next.sessions.reduce(
        (sumS, s) =>
          sumS +
          s.title.split(/\s+/).filter(Boolean).length +
          s.items.reduce(
            (sumI, i) =>
              sumI +
              i.content
                .replace(/<[^>]+>/g, " ")
                .split(/\s+/)
                .filter(Boolean).length,
            0
          ),
        0
      );
      const { error } = await supabase
        .from("sermons")
        .update({ content: payload, word_count: wordCount })
        .eq("id", sermonId);
      if (error) throw error;
    },
    [sermonId, supabase]
  );

  const status = useAutoSave({
    value: content,
    save,
    fallbackId: sermonId ?? "anon",
  });

  const update = useCallback(
    (next: SermonContent) => {
      setContent(next);
      onChange?.(next);
    },
    [onChange]
  );

  const updateSessions = useCallback(
    (mapper: (sessions: SessionNode[]) => SessionNode[]) => {
      update({ sessions: mapper(content.sessions) });
    },
    [content.sessions, update]
  );

  function handleTitleChange(id: string, title: string) {
    updateSessions((s) => s.map((sess) => (sess.id === id ? { ...sess, title } : sess)));
  }

  function handleItemContentChange(sessionId: string, itemId: string, c: string) {
    updateSessions((sessions) =>
      sessions.map((s) =>
        s.id !== sessionId
          ? s
          : { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, content: c } : i)) }
      )
    );
  }

  function handleItemTypeChange(sessionId: string, itemId: string, type: BlockTypeId) {
    updateSessions((sessions) =>
      sessions.map((s) =>
        s.id !== sessionId
          ? s
          : { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, type } : i)) }
      )
    );
  }

  function handleAddItem(sessionId: string, type: BlockTypeId) {
    updateSessions((sessions) =>
      sessions.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              items: [
                ...s.items,
                { id: newId(), type, content: "", order: s.items.length + 1 },
              ],
            }
      )
    );
  }

  function handleRemoveItem(sessionId: string, itemId: string) {
    updateSessions((sessions) =>
      sessions.map((s) =>
        s.id !== sessionId
          ? s
          : { ...s, items: s.items.filter((i) => i.id !== itemId) }
      )
    );
  }

  /** Insere um novo item Texto Bíblico logo APÓS o item indicado. */
  function handleInsertVerseAfter(
    sessionId: string,
    afterItemId: string,
    canonical: string,
    fullText: string,
    chosenVersion: BibleVersionId
  ) {
    updateSessions((sessions) =>
      sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const idx = s.items.findIndex((i) => i.id === afterItemId);
        if (idx === -1) return s;
        // Conteúdo como HTML legítimo: cada versículo num <p>, com a referência
        // separada. \n não é respeitado em TipTap, então uso markup explícito.
        const versionLabel = chosenVersion.toUpperCase();
        const html =
          `<p><em>${escapeHtml(fullText)}</em></p>` +
          `<p><strong>${escapeHtml(canonical)}</strong> <span class="vox-mono">· ${escapeHtml(versionLabel)}</span></p>`;
        const newItem = {
          id: newId(),
          type: "texto_biblico" as BlockTypeId,
          content: html,
          order: idx + 2,
        };
        const before = s.items.slice(0, idx + 1);
        const after = s.items.slice(idx + 1).map((i, k) => ({
          ...i,
          order: idx + 3 + k,
        }));
        return { ...s, items: [...before, newItem, ...after] };
      })
    );
  }

  function handleRemoveSession(sessionId: string) {
    updateSessions((sessions) =>
      sessions
        .filter((s) => s.id !== sessionId)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  }

  function moveInArray<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    if (from < 0 || from >= arr.length) return arr;
    const next = arr.slice();
    const removed = next[from] as T;
    next.splice(from, 1);
    next.splice(to, 0, removed);
    return next;
  }

  function handleMoveSession(sessionId: string, direction: "up" | "down") {
    updateSessions((sessions) => {
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx === -1) return sessions;
      const target = direction === "up" ? idx - 1 : idx + 1;
      return moveInArray(sessions, idx, target).map((s, i) => ({
        ...s,
        order: i + 1,
      }));
    });
  }

  function handleMoveItem(
    sessionId: string,
    itemId: string,
    direction: "up" | "down"
  ) {
    updateSessions((sessions) =>
      sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const idx = s.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return s;
        const target = direction === "up" ? idx - 1 : idx + 1;
        const reordered = moveInArray(s.items, idx, target).map((i, k) => ({
          ...i,
          order: k + 1,
        }));
        return { ...s, items: reordered };
      })
    );
  }

  function handleAddSession(role: SessionRole) {
    const label =
      role === "introducao" ? "Introdução" :
      role === "conclusao" ? "Conclusão" :
      role === "topico" ? `Tópico ${content.sessions.filter((s) => s.role === "topico").length + 1}` :
      "Nova sessão";
    update({
      sessions: [
        ...content.sessions,
        {
          id: newId(),
          title: label,
          role,
          order: content.sessions.length + 1,
          items: [],
        },
      ],
    });
  }

  const statusColor =
    status === "offline"
      ? "var(--vox-gold)"
      : status === "saving" || status === "dirty"
        ? "var(--vox-prose)"
        : "var(--vox-muted)";

  // Folha em branco: editor minimal sem badges, sem dropdowns, sem framework hints.
  const isBlank = framework === "livre";

  return (
    <div className="space-y-3">
      {sermonId ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {recoveredFromOffline ? (
            <span
              className="vox-mono text-[11px] px-2 py-1 rounded-full"
              style={{
                background: "var(--vox-gold-soft, rgba(180,83,9,0.10))",
                color: "var(--vox-gold)",
              }}
            >
              Recuperado do rascunho offline
            </span>
          ) : (
            <span />
          )}
          <span
            className="vox-mono text-[11px]"
            style={{ color: statusColor }}
            aria-live="polite"
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      ) : null}

      {/* "Folha branca" — uma única superfície contínua. Tópicos ficam dentro,
         separados apenas por espaço e uma barra de cor à esquerda. Não há
         cards individuais. */}
      <article
        className="vox-paper rounded-xl bg-card px-4 py-6 sm:px-12 sm:py-12"
        style={{
          border: "1px solid var(--vox-whisper)",
          boxShadow: "var(--vox-shadow-card)",
        }}
      >
        <div>
          {content.sessions.map((session, idx) => {
            const advice = adviseSession(session, framework);
            return (
              <SessionCard
                key={session.id}
                session={session}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === content.sessions.length - 1}
                bibleVersion={bibleVersion}
                suggestions={isBlank ? undefined : advice}
                minimal={isBlank}
                onTitleChange={handleTitleChange}
                onItemContentChange={handleItemContentChange}
                onItemTypeChange={handleItemTypeChange}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onRemoveSession={
                  content.sessions.length > 1 ? handleRemoveSession : undefined
                }
                onMoveSession={
                  content.sessions.length > 1 ? handleMoveSession : undefined
                }
                onMoveItem={handleMoveItem}
                onInsertVerseAfter={handleInsertVerseAfter}
              />
            );
          })}
        </div>

        <div
          className="mt-8 pt-6"
          style={{ borderTop: "1px dashed var(--vox-whisper)" }}
        >
          {isBlank ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddSession("topico")}
              className="text-vox-prose"
            >
              + Inserir tópico
            </Button>
          ) : (
            // Ação primária à esquerda; opções secundárias em dropdown discreto.
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleAddSession("topico")}>
                + Tópico
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-vox-muted hover:text-vox-prose">
                    Outra sessão ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => handleAddSession("introducao")}>
                    Introdução
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleAddSession("conclusao")}>
                    Conclusão
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleAddSession("livre")}>
                    Sessão livre
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </article>

      {/* item count utility uses getBlockType to keep tree-shaker happy */}
      <span className="sr-only">{getBlockType("texto_biblico")?.label}</span>
    </div>
  );
}
