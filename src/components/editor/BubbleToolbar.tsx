"use client";

// Toolbar flutuante que aparece quando há texto selecionado dentro de um
// editor TipTap. Estilo Word/Notion: sai do topo da seleção, segue scroll.
// Renderiza via Portal pra não ser cortado por containers com overflow.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Quote,
  Link2,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { findFirstReference } from "@/lib/bible/parser";
import type { BibleVersionId } from "@/lib/bible/versions";

interface BubbleToolbarProps {
  editor: Editor | null;
  /** Versão para o auto-preenchimento bíblico (default acf) */
  bibleVersion?: BibleVersionId;
}

export function BubbleToolbar({
  editor,
  bibleVersion = "acf",
}: BubbleToolbarProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { state, view } = editor;
      const { from, to, empty } = state.selection;

      if (empty || !view.hasFocus()) {
        setPos(null);
        setSelectedText("");
        return;
      }

      try {
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const selTop = Math.min(start.top, end.top);
        const selBottom = Math.max(start.bottom, end.bottom);
        const left = (start.left + end.left) / 2;
        // Se há espaço acima da seleção, posiciona acima. Senão, abaixo.
        // Evita a toolbar sair da viewport em blocos no topo da página.
        const TOOLBAR_HEIGHT = 40;
        const aboveTop = selTop - TOOLBAR_HEIGHT - 8;
        const top =
          aboveTop > 8 ? aboveTop : selBottom + 8;
        setPos({ top: top + window.scrollY, left: left + window.scrollX });
        setSelectedText(state.doc.textBetween(from, to, " "));
      } catch {
        setPos(null);
      }
    };

    const onBlur = () => setPos(null);

    editor.on("selectionUpdate", update);
    editor.on("blur", onBlur);
    editor.on("focus", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("blur", onBlur);
      editor.off("focus", update);
    };
  }, [editor]);

  if (!editor || !mounted || !pos) return null;

  function fire(cmd: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cmd();
    };
  }

  function promptLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  /** Detecta ref no texto selecionado, busca o versículo, substitui pela passagem
   *  formatada como blockquote estilo escritura + referência canônica. */
  async function insertBibleVerse() {
    if (!editor || busy) return;
    const ref = findFirstReference(selectedText);
    if (!ref) {
      toast.error("Referência bíblica não reconhecida", {
        description:
          "Selecione algo como 'Romanos 5:1', 'Sl 23' ou '1Co 13:4-7' e tente de novo.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bible?version=${encodeURIComponent(
          bibleVersion
        )}&reference=${encodeURIComponent(ref.canonical)}`
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as {
        canonical: string;
        verses: Array<{ number: number; text: string }>;
      };
      const text = data.verses.map((v) => `${v.number}. ${v.text}`).join(" ");
      const html = `<blockquote data-bible-verse="true" class="vox-scripture"><p><em>${escapeHtml(
        text
      )}</em></p><p><strong>${escapeHtml(data.canonical)}</strong></p></blockquote><p></p>`;
      // Substitui a seleção atual pelo blockquote
      editor.chain().focus().deleteSelection().insertContent(html).run();
      toast.success(data.canonical + " inserido");
    } catch (err) {
      toast.error("Falha ao buscar a passagem", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setBusy(false);
    }
  }

  const node = (
    <div
      className="vox-bubble-toolbar fixed z-[60] -translate-x-1/2 flex items-center gap-0.5 rounded-md px-1 py-1 shadow-lg"
      style={{
        top: pos.top,
        left: pos.left,
        background: "var(--vox-ink)",
        color: "#F1EDE7",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      // Importante: previne o blur do editor ao clicar nos botões
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={fire(() => editor.chain().focus().toggleBold().run())}
        label="Negrito (⌘B)"
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={fire(() => editor.chain().focus().toggleItalic().run())}
        label="Itálico (⌘I)"
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={fire(() => editor.chain().focus().toggleUnderline().run())}
        label="Sublinhado (⌘U)"
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={fire(() => editor.chain().focus().toggleStrike().run())}
        label="Tachado"
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={fire(() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        )}
        label="Subtítulo"
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={fire(() => editor.chain().focus().toggleBlockquote().run())}
        label="Citação"
      >
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={fire(promptLink)}
        label="Link"
      >
        <Link2 className="size-3.5" />
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        onClick={fire(() => void insertBibleVerse())}
        label={
          busy
            ? "Buscando…"
            : "Inserir versículo bíblico (selecione uma referência)"
        }
      >
        <BookMarked className="size-3.5" />
      </ToolbarButton>
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

function Divider() {
  return (
    <span
      className="inline-block w-px h-4 mx-0.5"
      style={{ background: "rgba(255,255,255,0.15)" }}
    />
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center size-7 rounded transition-colors",
        active
          ? "bg-[rgba(255,255,255,0.12)]"
          : "hover:bg-[rgba(255,255,255,0.08)]"
      )}
    >
      {children}
    </button>
  );
}
