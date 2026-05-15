// Issue 031 — Editor de bloco com TipTap real (substitui o <textarea> do proto).
// Auto-save é responsabilidade do componente pai (useAutoSave).

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import type { BlockType } from "@/lib/mocks/blocks";
import { cn } from "@/lib/utils";

interface SermonBlockEditorProps {
  type: BlockType;
  initialContent?: string;
  number?: number;
  onChange?: (htmlOrJson: string) => void;
  className?: string;
}

export function SermonBlockEditor({
  type,
  initialContent = "",
  number,
  onChange,
  className,
}: SermonBlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder: type.hint }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[3rem]",
          type.id === "texto_biblico" ? "vox-scripture-editor" : ""
        ),
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  if (!editor) return null;

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
      </header>

      <EditorContent
        editor={editor}
        style={{
          fontFamily:
            type.id === "texto_biblico" || type.id === "citacao"
              ? "var(--vox-font-display)"
              : "var(--vox-font-ui)",
          fontStyle: type.id === "texto_biblico" ? "italic" : "normal",
          fontSize: type.id === "texto_biblico" ? "var(--vox-text-lg)" : "var(--vox-text-md)",
          lineHeight: type.id === "texto_biblico" ? 1.7 : 1.55,
          color: "var(--vox-ink)",
        }}
      />
    </article>
  );
}
