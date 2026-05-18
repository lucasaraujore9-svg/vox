"use client";

// Toolbar flutuante via BubbleMenu oficial do TipTap. Aparece sobre QUALQUER
// editor TipTap focado com seleção não-vazia — não há mais conflito entre
// múltiplos editores (cada instância gerencia seu próprio menu via Tippy.js).
//
// Inclui: bold/italic/underline/strike, H2, blockquote, link, inserir versículo,
// cor do texto, marca-texto (highlight).

import { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
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
  Highlighter,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { findFirstReference } from "@/lib/bible/parser";
import type { BibleVersionId } from "@/lib/bible/versions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BubbleToolbarProps {
  editor: Editor | null;
  /** Versão para o auto-preenchimento bíblico (default acf) */
  bibleVersion?: BibleVersionId;
}

// Paleta enxuta — alinhada ao design-system. Editorial, sem neon.
const TEXT_COLORS: Array<{ name: string; value: string }> = [
  { name: "Padrão", value: "" }, // limpa cor
  { name: "Ink", value: "#18181B" },
  { name: "Forest", value: "#166534" },
  { name: "Gold", value: "#B45309" },
  { name: "Burgundy", value: "#9F1239" },
  { name: "Violeta", value: "#7C3AED" },
  { name: "Azure", value: "#1D4ED8" },
  { name: "Slate", value: "#475569" },
];

const HIGHLIGHT_COLORS: Array<{ name: string; value: string }> = [
  { name: "Remover", value: "" },
  { name: "Amarelo", value: "rgba(252, 211, 77, 0.45)" },
  { name: "Verde", value: "rgba(134, 239, 172, 0.45)" },
  { name: "Azul", value: "rgba(147, 197, 253, 0.45)" },
  { name: "Rosa", value: "rgba(249, 168, 212, 0.45)" },
  { name: "Lavanda", value: "rgba(196, 181, 253, 0.45)" },
  { name: "Pêssego", value: "rgba(253, 186, 116, 0.45)" },
];

export function BubbleToolbar({
  editor,
  bibleVersion = "acf",
}: BubbleToolbarProps) {
  const [busy, setBusy] = useState(false);

  if (!editor) return null;

  function fire(cmd: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cmd();
    };
  }

  function promptLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  /** Detecta ref no texto selecionado, busca versículo, insere blockquote. */
  async function insertBibleVerse() {
    if (!editor || busy) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
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

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: ed, from, to }) => {
        if (from === to) return false;
        if (!ed.isEditable) return false;
        return true;
      }}
    >
      <div
        className="vox-bubble-toolbar flex items-center gap-0.5 rounded-md px-1 py-1 shadow-lg"
        style={{
          background: "var(--vox-ink)",
          color: "#F1EDE7",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
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

        <ColorPicker
          label="Cor do texto"
          icon={<Palette className="size-3.5" />}
          swatches={TEXT_COLORS}
          activeValue={
            (editor.getAttributes("textStyle").color as string | undefined) ?? ""
          }
          onSelect={(value) => {
            if (!value) {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().setColor(value).run();
            }
          }}
        />
        <ColorPicker
          label="Marca-texto"
          icon={<Highlighter className="size-3.5" />}
          swatches={HIGHLIGHT_COLORS}
          activeValue={
            (editor.getAttributes("highlight").color as string | undefined) ?? ""
          }
          onSelect={(value) => {
            if (!value) {
              editor.chain().focus().unsetHighlight().run();
            } else {
              editor.chain().focus().toggleHighlight({ color: value }).run();
            }
          }}
        />

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
    </BubbleMenu>
  );
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

interface ColorPickerProps {
  label: string;
  icon: React.ReactNode;
  swatches: Array<{ name: string; value: string }>;
  activeValue: string;
  onSelect: (value: string) => void;
}

function ColorPicker({
  label,
  icon,
  swatches,
  activeValue,
  onSelect,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "inline-flex items-center justify-center size-7 rounded transition-colors",
            activeValue
              ? "bg-[rgba(255,255,255,0.12)]"
              : "hover:bg-[rgba(255,255,255,0.08)]"
          )}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-auto p-2"
        style={{
          background: "var(--vox-surface-elev, var(--vox-surface))",
          border: "1px solid var(--vox-whisper)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 flex-wrap max-w-[224px]">
          {swatches.map((s) => {
            const isClear = s.value === "";
            const isActive = activeValue === s.value;
            return (
              <button
                key={s.name}
                type="button"
                title={s.name}
                aria-label={s.name}
                onClick={() => {
                  onSelect(s.value);
                  setOpen(false);
                }}
                className={cn(
                  "inline-flex items-center justify-center size-7 rounded-md transition-transform hover:scale-110",
                  isActive ? "ring-2 ring-vox-ink ring-offset-1" : ""
                )}
                style={{
                  background: isClear ? "transparent" : s.value,
                  border: isClear
                    ? "1px dashed var(--vox-muted)"
                    : "1px solid var(--vox-whisper)",
                }}
              >
                {isClear ? (
                  <span
                    className="block w-full h-px rotate-45"
                    style={{ background: "var(--vox-muted)" }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
