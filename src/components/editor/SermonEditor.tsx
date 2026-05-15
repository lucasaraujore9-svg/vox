"use client";

// Editor de sermão com sessões. Wraps SessionCard com estado local + "+ Sessão"
// + reordering simples (up/down). Auto-save é responsabilidade do consumer.

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
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

interface SermonEditorProps {
  framework: FrameworkId;
  initialContent: SermonContent;
  /** Versão bíblica usada pelo autocomplete (default acf) */
  bibleVersion?: BibleVersionId;
  onChange?: (content: SermonContent) => void;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

export function SermonEditor({
  framework,
  initialContent,
  bibleVersion = "acf",
  onChange,
}: SermonEditorProps) {
  const [content, setContent] = useState<SermonContent>(initialContent);

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
    fullText: string
  ) {
    updateSessions((sessions) =>
      sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const idx = s.items.findIndex((i) => i.id === afterItemId);
        if (idx === -1) return s;
        const newItem = {
          id: newId(),
          type: "texto_biblico" as BlockTypeId,
          content: `${fullText}\n\n— ${canonical}`,
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

  return (
    <div className="space-y-6">
      {content.sessions.map((session, idx) => {
        const advice = adviseSession(session, framework);
        return (
          <SessionCard
            key={session.id}
            session={session}
            index={idx}
            bibleVersion={bibleVersion}
            suggestions={advice}
            onTitleChange={handleTitleChange}
            onItemContentChange={handleItemContentChange}
            onItemTypeChange={handleItemTypeChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onRemoveSession={
              content.sessions.length > 1 ? handleRemoveSession : undefined
            }
            onInsertVerseAfter={handleInsertVerseAfter}
          />
        );
      })}

      <footer className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => handleAddSession("topico")}>
          + Tópico
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAddSession("introducao")}>
          + Introdução
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAddSession("conclusao")}>
          + Conclusão
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAddSession("livre")}>
          + Sessão livre
        </Button>
      </footer>

      {/* item count utility uses getBlockType to keep tree-shaker happy in tests */}
      <span className="sr-only">{getBlockType("texto_biblico")?.label}</span>
    </div>
  );
}
