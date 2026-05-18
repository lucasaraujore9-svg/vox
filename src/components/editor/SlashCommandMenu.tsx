"use client";

// Slash command menu: ao digitar "/" no início de um parágrafo ou após espaço,
// abre uma lista flutuante com inserções rápidas (subtítulo, citação, lista,
// versículo bíblico, oração, separador). ESC fecha. ↑↓ navega. Enter insere.
//
// Não usa @tiptap/suggestion (não está instalado), implementação manual via
// listener de selectionUpdate + posição do cursor.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import {
  Heading2,
  List,
  ListOrdered,
  Minus,
  Quote,
  BookMarked,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { findFirstReference } from "@/lib/bible/parser";
import type { BibleVersionId } from "@/lib/bible/versions";
import { cn } from "@/lib/utils";

interface SlashCommandMenuProps {
  editor: Editor | null;
  bibleVersion?: BibleVersionId;
}

type CommandHandler = (editor: Editor) => void | Promise<void>;

interface SlashItem {
  id: string;
  label: string;
  description: string;
  Icon: typeof Heading2;
  keywords: string[];
  run: CommandHandler;
}

function makeItems(bibleVersion: BibleVersionId): SlashItem[] {
  return [
    {
      id: "h2",
      label: "Subtítulo",
      description: "Cabeçalho de seção dentro do item",
      Icon: Heading2,
      keywords: ["subtitulo", "titulo", "heading", "h2"],
      run: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: "quote",
      label: "Citação",
      description: "Bloco de citação estilo escritura",
      Icon: Quote,
      keywords: ["citacao", "quote", "citação"],
      run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: "bullet",
      label: "Lista com marcadores",
      description: "Pontos curtos, sem ordem",
      Icon: List,
      keywords: ["lista", "bullet", "ul", "marcadores"],
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: "ordered",
      label: "Lista numerada",
      description: "1, 2, 3…",
      Icon: ListOrdered,
      keywords: ["lista", "numerada", "ordered", "ol"],
      run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: "hr",
      label: "Separador",
      description: "Linha horizontal de quebra",
      Icon: Minus,
      keywords: ["separador", "linha", "hr", "divisor"],
      run: (editor) => {
        // Insere um <hr> como HTML, StarterKit não inclui horizontalRule aqui,
        // mas o navegador renderiza tag bruta.
        editor.chain().focus().insertContent("<hr>").run();
      },
    },
    {
      id: "prayer",
      label: "Oração",
      description: "Inserir bloco de oração (citação curta)",
      Icon: PenLine,
      keywords: ["oracao", "prece", "prayer"],
      run: (editor) => {
        editor
          .chain()
          .focus()
          .insertContent(
            '<blockquote><p><em>Senhor… </em></p></blockquote><p></p>'
          )
          .run();
      },
    },
    {
      id: "verse",
      label: "Versículo bíblico",
      description: "Cola a próxima palavra como referência (ex: João 3:16)",
      Icon: BookMarked,
      keywords: ["versiculo", "biblia", "passagem", "escritura"],
      run: async (editor) => {
        const ref = window.prompt(
          "Qual versículo? (ex: Romanos 5:1—11)",
          ""
        );
        if (!ref) return;
        const parsed = findFirstReference(ref);
        if (!parsed) {
          toast.error("Referência não reconhecida");
          return;
        }
        try {
          const res = await fetch(
            `/api/bible?version=${encodeURIComponent(
              bibleVersion
            )}&reference=${encodeURIComponent(parsed.canonical)}`
          );
          if (!res.ok) throw new Error(`${res.status}`);
          const data = (await res.json()) as {
            canonical: string;
            verses: Array<{ number: number; text: string }>;
          };
          const text = data.verses.map((v) => `${v.number}. ${v.text}`).join(" ");
          editor
            .chain()
            .focus()
            .insertContent(
              `<blockquote data-bible-verse="true" class="vox-scripture"><p><em>${escapeHtml(
                text
              )}</em></p><p><strong>${escapeHtml(
                data.canonical
              )}</strong></p></blockquote><p></p>`
            )
            .run();
          toast.success(`${data.canonical} inserido`);
        } catch (err) {
          toast.error("Falha ao buscar passagem", {
            description: err instanceof Error ? err.message : "Erro",
          });
        }
      },
    },
  ];
}

export function SlashCommandMenu({
  editor,
  bibleVersion = "acf",
}: SlashCommandMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [filter, setFilter] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  // Posição no documento onde o "/" foi digitado, usada para substituir.
  const slashStartRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const allItems = makeItems(bibleVersion);
  const items = filter
    ? allItems.filter((it) =>
      [it.label, ...it.keywords].some((s) =>
        s.toLowerCase().includes(filter.toLowerCase())
      )
    )
    : allItems;

  const close = useCallback(() => {
    setOpen(false);
    setFilter("");
    setActiveIdx(0);
    slashStartRef.current = null;
  }, []);

  const runItem = useCallback(
    async (item: SlashItem) => {
      if (!editor) return;
      // Remove o "/<filter>" digitado antes de aplicar o comando
      const slashStart = slashStartRef.current;
      if (slashStart !== null) {
        const to = editor.state.selection.from;
        editor.chain().focus().deleteRange({ from: slashStart, to }).run();
      }
      close();
      await item.run(editor);
    },
    [editor, close]
  );

  // Escuta mudanças no editor pra detectar "/" e atualizar filter
  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      const { state, view } = editor;
      const { from, empty } = state.selection;
      if (!empty) {
        close();
        return;
      }
      // Pega o texto desde o início do bloco até o cursor
      const $from = state.doc.resolve(from);
      const startOfBlock = $from.start();
      const textBefore = state.doc.textBetween(startOfBlock, from, "\n", " ");

      // Procura pelo último "/" seguido apenas de palavra (sem espaço)
      const match = /(?:^|\s)\/([\p{L}\d]*)$/u.exec(textBefore);
      if (!match) {
        close();
        return;
      }

      // Calcula posição absoluta do "/"
      const matchStartInBefore = match.index + (match[0].startsWith("/") ? 0 : 1);
      const slashAbsPos = startOfBlock + matchStartInBefore;

      slashStartRef.current = slashAbsPos;
      setFilter(match[1] ?? "");
      setActiveIdx(0);
      setOpen(true);

      // Posiciona o menu abaixo do cursor
      try {
        const coords = view.coordsAtPos(from);
        setPos({ top: coords.bottom + window.scrollY + 6, left: coords.left + window.scrollX });
      } catch {
        setPos(null);
      }
    };

    editor.on("selectionUpdate", onUpdate);
    editor.on("update", onUpdate);
    return () => {
      editor.off("selectionUpdate", onUpdate);
      editor.off("update", onUpdate);
    };
  }, [editor, close]);

  // Navegação por teclado
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = items[activeIdx];
        if (!item) return;
        e.preventDefault();
        void runItem(item);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, items, activeIdx, close, runItem]);

  if (!mounted || !open || !pos || items.length === 0) return null;

  const node = (
    <div
      className="fixed z-[60] rounded-md shadow-lg"
      style={{
        top: pos.top,
        left: pos.left,
        width: 260,
        background: "var(--vox-surface)",
        border: "1px solid var(--vox-whisper)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ul>
        {items.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void runItem(item)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
                  idx === activeIdx ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <Icon className="size-4 mt-0.5 shrink-0 text-vox-forest" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vox-ink">{item.label}</p>
                  <p className="text-xs text-vox-muted line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return createPortal(node, document.body);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
