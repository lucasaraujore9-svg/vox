// Issue 036 — Custom Node do TipTap para inserir versículos bíblicos como Mark especial.
// Renderiza o texto com a tipografia de citação (Fraunces itálico) e mantém uma referência
// curta (Romanos 5:1) como atributo. O conteúdo vem de /api/bible.

import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bibleVerse: {
      insertBibleVerse: (verse: { reference: string; text: string }) => ReturnType;
    };
  }
}

export const BibleVerse = Node.create({
  name: "bibleVerse",
  group: "block",
  content: "text*",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      reference: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "blockquote[data-bible-verse]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "blockquote",
      mergeAttributes(HTMLAttributes, {
        "data-bible-verse": "true",
        class: "vox-scripture",
        style: "border-left: 3px solid var(--vox-gold); padding-left: 12px; margin: 16px 0;",
      }),
      ["span", { class: "vox-scripture-text" }, 0],
      [
        "footer",
        { class: "vox-ref", style: "margin-top: 6px;" },
        HTMLAttributes.reference,
      ],
    ];
  },

  addCommands() {
    return {
      insertBibleVerse:
        ({ reference, text }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { reference },
            content: [{ type: "text", text }],
          }),
    };
  },
});

/** Fetch helper usado pelo botão "Inserir versículo" no toolbar do editor. */
export async function fetchVerse(version: string, reference: string): Promise<{
  reference: string;
  text: string;
}> {
  const url = `/api/bible?version=${encodeURIComponent(version)}&reference=${encodeURIComponent(reference)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }
  return res.json();
}
