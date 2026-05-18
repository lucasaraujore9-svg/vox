"use client";

// Editor rico baseado em TipTap para um item de sessão.
// - Auto-grow nativo (sem rows, pretende ocupar o necessário).
// - BubbleToolbar via @tiptap/extension-bubble-menu (oficial, mais robusto
//   que portal manual, funciona em todos os blocos, posiciona certo, não
//   compete entre instâncias).
// - SlashCommandMenu (manual) ao digitar "/".
// - Suporte a cor do texto e highlight translúcido.

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";
import { BubbleToolbar } from "./BubbleToolbar";
import { SlashCommandMenu } from "./SlashCommandMenu";

interface RichTextItemProps {
  initialContent: string;
  placeholder?: string;
  /** Tipo do bloco, usado pra escolher variante visual (citação, escritura). */
  variant?: "default" | "scripture";
  /** Versão bíblica para o BubbleMenu (botão Inserir versículo) */
  bibleVersion?: import("@/lib/bible/versions").BibleVersionId;
  onChange?: (html: string) => void;
  className?: string;
}

export function RichTextItem({
  initialContent,
  placeholder,
  variant = "default",
  bibleVersion,
  onChange,
  className,
}: RichTextItemProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Mantemos H2 como subtítulo dentro de itens. Hr/codeBlock saem.
        heading: { levels: [2] },
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      // TextStyle precisa vir antes de Color, Color depende dele.
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: placeholder ?? "Comece a escrever…",
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Atalho de teclado: ⌘/Ctrl+B/I/U já vem do StarterKit/Underline.
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Atualiza placeholder ao trocar o tipo do bloco
  useEffect(() => {
    if (!editor) return;
    const placeholderExt = editor.extensionManager.extensions.find(
      (e) => e.name === "placeholder"
    );
    if (placeholderExt) {
      placeholderExt.options.placeholder = placeholder ?? "Comece a escrever…";
      editor.view.dispatch(editor.state.tr);
    }
  }, [editor, placeholder]);

  // Reage a mudanças externas do conteúdo inicial (ex: framework muda).
  // Cuidado: não reseta a cada keystroke; só quando o externo diverge do interno.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialContent && initialContent !== current) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  useEffect(() => () => editor?.destroy(), [editor]);

  return (
    <div
      className={cn(
        "vox-prose-editor relative",
        variant === "scripture" && "is-scripture",
        className
      )}
    >
      <EditorContent editor={editor} />
      <BubbleToolbar editor={editor} bibleVersion={bibleVersion} />
      <SlashCommandMenu editor={editor} bibleVersion={bibleVersion} />
    </div>
  );
}
