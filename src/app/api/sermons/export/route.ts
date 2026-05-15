// Issue 047 — Exportação de sermão em PDF, DOCX e TXT.
// Recebe ?sermonId=<uuid>&format=pdf|docx|txt. Server-rendered, gera blob e retorna.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  sermonId: z.string().min(1).max(64),
  format: z.enum(["pdf", "docx", "txt"]),
});

interface BlockPayload {
  type: string;
  title?: string;
  content?: string;
}

function safeBlocks(raw: unknown): BlockPayload[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (b): b is { type?: unknown; title?: unknown; content?: unknown } =>
        b !== null && typeof b === "object"
    )
    .map((b) => ({
      type: typeof b.type === "string" ? b.type : "livre",
      title: typeof b.title === "string" ? b.title : "",
      content: typeof b.content === "string" ? b.content : "",
    }));
}

function toPlainText(
  title: string,
  bibleRef: string | null,
  blocks: BlockPayload[]
): string {
  const lines: string[] = [];
  lines.push(title);
  if (bibleRef) lines.push(bibleRef);
  lines.push("");
  for (const block of blocks) {
    lines.push(`— ${block.title || block.type.toUpperCase()} —`);
    if (block.content) lines.push(block.content);
    lines.push("");
  }
  return lines.join("\n");
}

async function buildDocx(
  title: string,
  bibleRef: string | null,
  blocks: BlockPayload[]
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
  }
  for (const block of blocks) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: block.title || block.type })],
      })
    );
    if (block.content) {
      children.push(new Paragraph({ children: [new TextRun({ text: block.content })] }));
    }
  }
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

async function buildPdf(
  title: string,
  bibleRef: string | null,
  blocks: BlockPayload[]
): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  function addLine(text: string, size: number, opts?: { bold?: boolean; italic?: boolean }) {
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
  }

  addLine(title, 22, { bold: true });
  if (bibleRef) addLine(bibleRef, 12, { italic: true });
  y += 12;

  for (const block of blocks) {
    addLine(block.title || block.type.toUpperCase(), 13, { bold: true });
    if (block.content) addLine(block.content, 11);
    y += 8;
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
    .select("title, bible_ref, content")
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sermon) {
    return NextResponse.json({ error: "Sermão não encontrado" }, { status: 404 });
  }
  const blocks = safeBlocks(sermon.content);

  const safeName = sermon.title.replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60);

  if (format === "txt") {
    const body = toPlainText(sermon.title, sermon.bible_ref, blocks);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.txt"`,
      },
    });
  }
  if (format === "docx") {
    const buffer = await buildDocx(sermon.title, sermon.bible_ref, blocks);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
  }
  // pdf
  const pdf = await buildPdf(sermon.title, sermon.bible_ref, blocks);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
    },
  });
}
