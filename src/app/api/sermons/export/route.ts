// Issue 047 — Exportação de sermão em PDF, DOCX e TXT.
// Recebe ?sermonId=<uuid>&format=pdf|docx|txt. Server-rendered, gera blob e retorna.
// O conteúdo é { sessions: [{ title, items: [{ type, content }] }] } — itera nesse formato.
// Tolera também o formato legado (array plano de blocos) via parseSermonContent.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseSermonContent, type SessionNode } from "@/lib/sermons/sessions";
import { getBlockType } from "@/lib/mocks/blocks";
import type { FrameworkId } from "@/lib/mocks/frameworks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  sermonId: z.string().min(1).max(64),
  format: z.enum(["pdf", "docx", "txt"]),
});

/** Converte HTML simples do TipTap (p, br, strong, em…) em texto puro. */
function htmlToPlainText(html: string): string {
  if (!html) return "";
  // Sem DOMParser server-side; usa regex defensivo.
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(h[1-6]|div|li)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function blockLabel(type: string): string {
  const block = getBlockType(type as never);
  return block?.label ?? type;
}

function toPlainText(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): string {
  const lines: string[] = [];
  lines.push(title);
  if (bibleRef) lines.push(bibleRef);
  lines.push("");
  for (const session of sessions) {
    lines.push(`═══ ${session.title} ═══`);
    lines.push("");
    for (const item of session.items) {
      const text = htmlToPlainText(item.content);
      lines.push(`— ${blockLabel(item.type)} —`);
      if (text) lines.push(text);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

async function buildDocx(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true })],
    }),
  ];
  if (bibleRef) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: bibleRef, italics: true })] })
    );
    children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }
  for (const session of sessions) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: session.title, bold: true })],
      })
    );
    for (const item of session.items) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: blockLabel(item.type), italics: true })],
        })
      );
      const text = htmlToPlainText(item.content);
      if (text) {
        // quebra em parágrafos para preservar quebras de linha
        for (const para of text.split(/\n{2,}/)) {
          children.push(
            new Paragraph({ children: [new TextRun({ text: para })] })
          );
        }
      }
    }
  }
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

async function buildPdf(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  function addLine(
    text: string,
    size: number,
    opts?: { bold?: boolean; italic?: boolean; gap?: number }
  ) {
    doc.setFont("helvetica", opts?.bold ? "bold" : opts?.italic ? "italic" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 1.4;
    }
    if (opts?.gap) y += opts.gap;
  }

  addLine(title, 22, { bold: true });
  if (bibleRef) addLine(bibleRef, 12, { italic: true, gap: 8 });
  y += 12;

  for (const session of sessions) {
    addLine(session.title, 15, { bold: true, gap: 4 });
    for (const item of session.items) {
      addLine(blockLabel(item.type), 11, { italic: true });
      const text = htmlToPlainText(item.content);
      if (text) addLine(text, 11, { gap: 6 });
    }
    y += 6;
  }
  return doc.output("arraybuffer") as ArrayBuffer;
}

export async function GET(request: NextRequest) {
  const params = querySchema.safeParse({
    sermonId: request.nextUrl.searchParams.get("sermonId"),
    format: request.nextUrl.searchParams.get("format"),
  });
  if (!params.success) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }
  const { sermonId, format } = params.data;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Modo demo: configure Supabase em .env.local pra exportar." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: sermon } = await supabase
    .from("sermons")
    .select("title, bible_ref, content, framework")
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sermon) {
    return NextResponse.json({ error: "Sermão não encontrado" }, { status: 404 });
  }
  const parsed = parseSermonContent(
    sermon.content,
    (sermon.framework ?? "livre") as FrameworkId
  );
  const sessions = parsed.sessions;

  const safeName =
    sermon.title.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60) || "manuscrito";

  if (format === "txt") {
    const body = toPlainText(sermon.title, sermon.bible_ref, sessions);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.txt"`,
      },
    });
  }
  if (format === "docx") {
    const buffer = await buildDocx(sermon.title, sermon.bible_ref, sessions);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  }
  // pdf
  const pdf = await buildPdf(sermon.title, sermon.bible_ref, sessions);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
    },
  });
}
