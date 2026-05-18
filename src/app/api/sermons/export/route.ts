// Exportação de manuscrito em PDF / DOCX / TXT.
// PDF e DOCX reproduzem a formatação visual do editor:
//   - cor do bloco (dot + eyebrow)
//   - barra vertical colorida ao lado da sessão (PDF)
//   - tipografia: title display, eyebrow mono, prose ui
//   - formatação inline (negrito, itálico, sublinhado) preservada
//   - blockquote, listas e quebras
// TXT continua simples, fluxo plano.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseSermonContent, type SessionNode, type SessionRole } from "@/lib/sermons/sessions";
import { getBlockType, type BlockTypeId } from "@/lib/mocks/blocks";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import {
  BLOCK_COLOR_HEX,
  SESSION_ROLE_HEX,
  VOX_HEX,
  hexToRgb,
} from "@/lib/sermons/export-tokens";
import { htmlToParas, type Para, type Run } from "@/lib/sermons/export-html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  sermonId: z.string().min(1).max(64),
  format: z.enum(["pdf", "docx", "txt"]),
});

function blockLabel(item: { type: BlockTypeId; label?: string }): string {
  if (item.label) return item.label;
  return getBlockType(item.type)?.label ?? item.type;
}

function blockColor(type: BlockTypeId): string {
  return BLOCK_COLOR_HEX[type] ?? VOX_HEX.muted;
}

function roleColor(role: SessionRole): string {
  return SESSION_ROLE_HEX[role] ?? VOX_HEX.muted;
}

// --------------------------- TXT ---------------------------
function paraToPlainText(p: Para): string {
  const text = p.runs.map((r) => r.text).join("");
  if (p.kind === "li-bullet") return `• ${text}`;
  if (p.kind === "li-num") return `– ${text}`;
  if (p.kind === "quote") return `❝ ${text}`;
  return text;
}

function toPlainText(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): string {
  const lines: string[] = [title];
  if (bibleRef) lines.push(bibleRef);
  lines.push("");
  for (const session of sessions) {
    lines.push(`═══ ${session.title} ═══`);
    lines.push("");
    for (const item of session.items) {
      lines.push(`, ${blockLabel(item)},`);
      const paras = htmlToParas(item.content);
      for (const p of paras) {
        lines.push(paraToPlainText(p));
      }
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

// --------------------------- DOCX ---------------------------
async function buildDocx(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): Promise<Buffer> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    LevelFormat,
  } = await import("docx");

  function runToTextRun(run: Run): InstanceType<typeof TextRun> {
    return new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italic,
      underline: run.underline ? {} : undefined,
      strike: run.strike,
      color: run.href ? "1D4ED8" : undefined,
    });
  }

  function paraFor(p: Para): InstanceType<typeof Paragraph> {
    const children = p.runs.map(runToTextRun);
    switch (p.kind) {
      case "h2":
        return new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children,
        });
      case "quote":
        return new Paragraph({
          children,
          indent: { left: 360 },
          spacing: { before: 120, after: 120 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 12,
              space: 12,
              color: VOX_HEX.gold.replace("#", ""),
            },
          },
        });
      case "li-bullet":
        return new Paragraph({
          children,
          bullet: { level: p.depth ?? 0 },
        });
      case "li-num":
        return new Paragraph({
          children,
          numbering: { reference: "vox-ol", level: p.depth ?? 0 },
        });
      case "p":
      default:
        return new Paragraph({ children, spacing: { after: 120 } });
    }
  }

  const children: InstanceType<typeof Paragraph>[] = [];

  // Cabeçalho do manuscrito, título em destaque, ref bíblica em mono itálico.
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: VOX_HEX.ink.replace("#", ""),
          size: 52,
        }),
      ],
      spacing: { after: 100 },
    })
  );
  if (bibleRef) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: bibleRef,
            italics: true,
            color: VOX_HEX.gold.replace("#", ""),
          }),
        ],
        spacing: { after: 240 },
      })
    );
  }

  for (let si = 0; si < sessions.length; si++) {
    const session = sessions[si];
    if (!session) continue;
    const sessionColor = roleColor(session.role).replace("#", "");

    // Linha decorativa de separação ANTES da sessão (a partir da 2ª).
    if (si > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: VOX_HEX.whisper.replace("#", ""),
              space: 1,
            },
          },
          spacing: { before: 240, after: 240 },
        })
      );
    }

    // Título da sessão com barra colorida à esquerda, emula a barra vertical
    // do editor. No DOCX a barra vira borda esquerda do parágrafo.
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: session.title || `Sessão ${si + 1}`,
            bold: true,
            color: VOX_HEX.ink.replace("#", ""),
            size: 36,
          }),
        ],
        spacing: { before: 200, after: 160 },
        border: {
          left: {
            style: BorderStyle.SINGLE,
            size: 18,
            space: 12,
            color: sessionColor,
          },
        },
      })
    );

    for (const item of session.items) {
      const color = blockColor(item.type).replace("#", "");
      // Eyebrow, DOT + label colorido, em letra menor.
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true, color }),
            new TextRun({
              text: blockLabel(item).toUpperCase(),
              bold: true,
              color,
              size: 18,
            }),
          ],
          spacing: { before: 160, after: 60 },
        })
      );
      const paras = htmlToParas(item.content);
      if (paras.length === 0) continue;
      for (const p of paras) {
        children.push(paraFor(p));
      }
    }
  }

  const doc = new Document({
    creator: "VOX",
    title,
    description: bibleRef ?? undefined,
    numbering: {
      config: [
        {
          reference: "vox-ol",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 360, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// --------------------------- PDF ---------------------------
async function buildPdf(
  title: string,
  bibleRef: string | null,
  sessions: SessionNode[]
): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentLeft = margin + 14; // espaço pra barra colorida da sessão
  const maxWidth = pageWidth - contentLeft - margin;

  let y = margin;
  // Estado da barra de sessão: pintada da posição inicial até o fim.
  let currentSessionStartY = 0;
  let currentSessionColor: string | null = null;

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      // Pinta a barra restante da sessão antes da quebra de página.
      if (currentSessionColor) {
        drawSessionBar(currentSessionStartY, y - 4, currentSessionColor);
      }
      doc.addPage();
      y = margin;
      currentSessionStartY = y;
    }
  }

  function drawSessionBar(fromY: number, toY: number, color: string) {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b);
    doc.rect(margin, fromY, 3, Math.max(2, toY - fromY), "F");
  }

  function drawDot(x: number, baselineY: number, color: string, size = 3) {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b);
    doc.circle(x + size, baselineY - 3, size, "F");
  }

  function setInkColor(hex: string) {
    const [r, g, b] = hexToRgb(hex);
    doc.setTextColor(r, g, b);
  }

  // Calcula a fonte de uma run baseada em bold/italic.
  function fontStyle(run: Run): "normal" | "bold" | "italic" | "bolditalic" {
    if (run.bold && run.italic) return "bolditalic";
    if (run.bold) return "bold";
    if (run.italic) return "italic";
    return "normal";
  }

  // Renderiza uma sequência de runs com word-wrap manual, preservando estilos.
  function drawRuns(
    runs: Run[],
    fontSize: number,
    color: string,
    opts: { leftPad?: number; lineGap?: number } = {}
  ) {
    const leftPad = opts.leftPad ?? 0;
    const lineGap = opts.lineGap ?? 1.45;
    const baseX = contentLeft + leftPad;
    const wrapWidth = maxWidth - leftPad;
    setInkColor(color);
    doc.setFontSize(fontSize);
    let x = baseX;
    const lineHeight = fontSize * lineGap;

    function newline() {
      y += lineHeight;
      x = baseX;
      ensureSpace(lineHeight);
    }
    ensureSpace(lineHeight);

    for (const run of runs) {
      doc.setFont("helvetica", fontStyle(run));
      // Sublinhado real fica complicado em jsPDF, usa text decoration via linha
      // depois de medir. Aqui pulamos sublinhado pra simplificar; bold/italic
      // são o que mais ajuda na fidelidade.
      const segments = run.text.split("\n");
      for (let si = 0; si < segments.length; si++) {
        if (si > 0) newline();
        const seg = segments[si] ?? "";
        if (!seg) continue;
        // Quebra por palavra pra manter formatação dentro do run.
        const words = seg.split(/(\s+)/); // mantém espaços
        for (const word of words) {
          if (!word) continue;
          const w = doc.getTextWidth(word);
          if (x + w > baseX + wrapWidth && x !== baseX) {
            newline();
          }
          // Se a palavra sozinha excede a largura, escreve mesmo assim (palavra
          // gigante / URL). jsPDF não quebra dentro da palavra automaticamente.
          doc.text(word, x, y);
          if (run.underline) {
            doc.setDrawColor(...hexToRgb(color));
            doc.setLineWidth(0.5);
            doc.line(x, y + 1.5, x + w, y + 1.5);
          }
          x += w;
        }
      }
    }
    y += lineHeight;
  }

  function drawParas(paras: Para[]) {
    for (const p of paras) {
      switch (p.kind) {
        case "h2":
          ensureSpace(28);
          y += 4;
          drawRuns(
            p.runs.map((r) => ({ ...r, bold: true })),
            14,
            VOX_HEX.ink,
            { lineGap: 1.3 }
          );
          y += 2;
          break;
        case "quote": {
          // blockquote: barra de gold + itálico
          const startY = y;
          drawRuns(
            p.runs.map((r) => ({ ...r, italic: true })),
            11,
            VOX_HEX.ink,
            { leftPad: 14, lineGap: 1.55 }
          );
          const [qr, qg, qb] = hexToRgb(VOX_HEX.gold);
          doc.setFillColor(qr, qg, qb);
          doc.rect(contentLeft + 4, startY - 8, 2, y - startY + 4, "F");
          y += 4;
          break;
        }
        case "li-bullet":
          drawRuns(
            [{ text: "•   " }, ...p.runs],
            11,
            VOX_HEX.prose,
            { leftPad: (p.depth ?? 0) * 12, lineGap: 1.5 }
          );
          break;
        case "li-num":
          drawRuns(
            [{ text: "•   " }, ...p.runs],
            11,
            VOX_HEX.prose,
            { leftPad: (p.depth ?? 0) * 12, lineGap: 1.5 }
          );
          break;
        case "p":
        default:
          drawRuns(p.runs, 11, VOX_HEX.prose, { lineGap: 1.55 });
          y += 4;
          break;
      }
    }
  }

  // ----- Cabeçalho do manuscrito -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  setInkColor(VOX_HEX.ink);
  const titleLines = doc.splitTextToSize(title, pageWidth - margin * 2);
  for (const line of titleLines) {
    ensureSpace(28);
    doc.text(line, margin, y + 20);
    y += 28;
  }
  if (bibleRef) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    setInkColor(VOX_HEX.gold);
    ensureSpace(18);
    doc.text(bibleRef, margin, y + 12);
    y += 22;
  }
  y += 8;

  // ----- Sessões -----
  for (let si = 0; si < sessions.length; si++) {
    const session = sessions[si];
    if (!session) continue;

    // Encerra a barra anterior antes de mudar de sessão.
    if (currentSessionColor) {
      drawSessionBar(currentSessionStartY, y - 4, currentSessionColor);
    }
    // Separador suave entre sessões.
    if (si > 0) {
      const [wr, wg, wb] = hexToRgb(VOX_HEX.whisper);
      doc.setDrawColor(wr, wg, wb);
      doc.setLineWidth(0.6);
      ensureSpace(18);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 16;
    }

    currentSessionColor = roleColor(session.role);
    currentSessionStartY = y;

    // Título da sessão
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    setInkColor(VOX_HEX.ink);
    ensureSpace(26);
    doc.text(session.title || `Sessão ${si + 1}`, contentLeft, y + 18);
    y += 30;

    for (const item of session.items) {
      const color = blockColor(item.type);
      // Eyebrow: DOT + label maiúsculo colorido em mono.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setInkColor(color);
      ensureSpace(14);
      drawDot(contentLeft, y + 8, color, 2.2);
      doc.text(
        blockLabel(item).toUpperCase(),
        contentLeft + 10,
        y + 9
      );
      y += 14;

      const paras = htmlToParas(item.content);
      if (paras.length === 0) {
        y += 4;
        continue;
      }
      drawParas(paras);
      y += 4;
    }
    y += 8;
  }

  // Pinta a barra da última sessão.
  if (currentSessionColor) {
    drawSessionBar(currentSessionStartY, y - 4, currentSessionColor);
  }

  return doc.output("arraybuffer") as ArrayBuffer;
}

// --------------------------- ROUTE ---------------------------
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
