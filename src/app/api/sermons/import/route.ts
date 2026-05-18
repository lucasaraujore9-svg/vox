// Issue 034, Importação de conteúdo (.docx ou texto).
// Recebe FormData com `file` (opcional) ou `text` + metadados.
// Gera SermonContent ({ sessions: [...] }), mesma estrutura que o editor lê/escreve.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  parseDocxToContent,
  parseTextToContent,
  countWords,
} from "@/lib/import/parser";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024;

const metaSchema = z.object({
  title: z.string().trim().min(1).max(240),
  bible_ref: z.string().trim().optional(),
  framework: z
    .enum(["expositivo", "textual", "narrativo", "tematico", "topico", "livre"])
    .default("livre"),
  content_type: z.enum(["sermão", "palestra", "aula"]).default("sermão"),
});

export async function POST(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Modo demo: configure Supabase em .env.local pra importar." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const formData = await request.formData();
  const meta = metaSchema.safeParse({
    title: formData.get("title"),
    bible_ref: formData.get("bible_ref") || undefined,
    framework: formData.get("framework") || "livre",
    content_type: formData.get("content_type") || "sermão",
  });
  if (!meta.success) {
    return NextResponse.json(
      { error: "Metadados inválidos", details: meta.error.flatten() },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const text = formData.get("text");

  let content;
  if (file instanceof File) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo excede 10MB" }, { status: 413 });
    }
    const ab = await file.arrayBuffer();
    if (file.name.toLowerCase().endsWith(".docx")) {
      content = await parseDocxToContent(ab, meta.data.framework);
    } else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      const decoder = new TextDecoder();
      content = parseTextToContent(decoder.decode(ab), meta.data.framework);
    } else {
      return NextResponse.json(
        { error: "Formato não suportado. Use .docx ou .txt." },
        { status: 415 }
      );
    }
  } else if (typeof text === "string" && text.trim().length > 0) {
    content = parseTextToContent(text, meta.data.framework);
  } else {
    return NextResponse.json(
      { error: "Envie um arquivo ou cole o texto" },
      { status: 400 }
    );
  }

  if (content.sessions.length === 0) {
    return NextResponse.json(
      { error: "Não foi possível extrair conteúdo" },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("sermons")
    .insert({
      user_id: user.id,
      title: meta.data.title,
      framework: meta.data.framework,
      content_type: meta.data.content_type,
      bible_ref: meta.data.bible_ref ?? null,
      content: content as unknown as Json,
      word_count: countWords(content),
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao salvar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    sessions: content.sessions.length,
    items: content.sessions.reduce((sum, s) => sum + s.items.length, 0),
  });
}
