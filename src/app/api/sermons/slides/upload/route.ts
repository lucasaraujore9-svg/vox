// Route Handler, upload de PDF (ou imagens) e conversão server-side em slides WebP.
// Issue 024 · ~50MB por arquivo, output 1280x720, salva no bucket privado sermon-slides.
// Os slides entram DEPOIS dos que já existem, nunca sobrescrevem a ordem anterior.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

const queryParamsSchema = z.object({
  sermonId: z.string().uuid("sermonId inválido"),
});

async function pdfToWebpBuffers(pdfBytes: ArrayBuffer): Promise<Buffer[]> {
  // pdfjs-dist precisa de canvas no Node, usa o reaper que vem com pdfjs-dist >= 4
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const sharp = (await import("sharp")).default;

  // Standard fonts são necessárias para evitar warnings de render
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  // Renderiza para um canvas via @napi-rs/canvas; carrega uma vez só.
  let canvasMod: typeof import("@napi-rs/canvas");
  try {
    canvasMod = await import("@napi-rs/canvas");
  } catch {
    throw new Error(
      "Conversão de PDF indisponível no servidor. Suba as páginas como imagem (PNG ou JPG) enquanto isso."
    );
  }

  const out: Buffer[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scale = SLIDE_WIDTH / viewport.width;
    const scaled = page.getViewport({ scale });

    const canvas = canvasMod.createCanvas(
      Math.ceil(scaled.width),
      Math.ceil(scaled.height)
    );
    const ctx = canvas.getContext("2d");
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: scaled,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const webp = await sharp(pngBuffer)
      .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 82 })
      .toBuffer();
    out.push(webp);
  }
  return out;
}

async function imageToWebpBuffer(bytes: ArrayBuffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(bytes))
    .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "contain", background: "#ffffff" })
    .webp({ quality: 82 })
    .toBuffer();
}

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") || IMAGE_EXTENSIONS.some((e) => name.endsWith(e))
  );
}

export async function POST(request: NextRequest) {
  const params = queryParamsSchema.safeParse({
    sermonId: request.nextUrl.searchParams.get("sermonId"),
  });
  if (!params.success) {
    return NextResponse.json(
      { error: "sermonId inválido" },
      { status: 400 }
    );
  }
  const { sermonId } = params.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Confere que o conteúdo é do usuário
  const { data: sermon } = await supabase
    .from("sermons")
    .select("id, type")
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sermon) {
    return NextResponse.json({ error: "Conteúdo não encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  const tooBig = files.find((f) => f.size > MAX_BYTES);
  if (tooBig) {
    return NextResponse.json(
      { error: `"${tooBig.name}" passa de 50MB` },
      { status: 413 }
    );
  }
  const unsupported = files.find((f) => !isPdfFile(f) && !isImageFile(f));
  if (unsupported) {
    return NextResponse.json(
      {
        error:
          `"${unsupported.name}" não é suportado. Envie PDF, PNG, JPG ou WebP. ` +
          "Para PPT, exporte como PDF no PowerPoint ou Keynote antes.",
      },
      { status: 415 }
    );
  }

  // Converte tudo antes de tocar no Storage, pra não deixar lixo se falhar no meio.
  const webpBuffers: Buffer[] = [];
  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      if (isPdfFile(file)) {
        webpBuffers.push(...(await pdfToWebpBuffers(bytes)));
      } else {
        webpBuffers.push(await imageToWebpBuffer(bytes));
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao converter o arquivo em slides",
      },
      { status: 500 }
    );
  }

  if (webpBuffers.length === 0) {
    return NextResponse.json(
      { error: "O arquivo não gerou nenhuma página" },
      { status: 422 }
    );
  }

  // Continua a numeração a partir do último slide existente.
  const { data: lastSlide } = await supabase
    .from("slides")
    .select("order")
    .eq("sermon_id", sermonId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const startOrder = (lastSlide?.order ?? 0) + 1;

  // Sufixo por lote, evita colidir com uploads anteriores no mesmo caminho.
  const batch = crypto.randomUUID().slice(0, 8);

  const inserted: Array<{ order: number; storage_path: string }> = [];
  for (let i = 0; i < webpBuffers.length; i += 1) {
    const order = startOrder + i;
    const storagePath = `${user.id}/${sermonId}/${batch}-${String(order).padStart(3, "0")}.webp`;
    const buf = webpBuffers[i];
    if (!buf) continue;
    const uploadRes = await supabase.storage
      .from("sermon-slides")
      .upload(storagePath, buf, {
        contentType: "image/webp",
        upsert: true,
      });
    if (uploadRes.error) {
      return NextResponse.json(
        { error: `Falha no upload do slide ${order}: ${uploadRes.error.message}` },
        { status: 500 }
      );
    }
    inserted.push({ order, storage_path: storagePath });
  }

  // Insere registros na tabela slides. image_url fica null: a URL é assinada na leitura.
  const rows = inserted.map((s) => ({
    sermon_id: sermonId,
    order: s.order,
    image_url: null,
    storage_path: s.storage_path,
  }));
  const { error: insertError } = await supabase.from("slides").insert(rows);
  if (insertError) {
    // Limpa os arquivos órfãos do Storage antes de devolver o erro.
    await supabase.storage
      .from("sermon-slides")
      .remove(inserted.map((s) => s.storage_path));
    return NextResponse.json(
      { error: `Falha ao salvar slides: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Garante o formato apresentação e a fonte dos slides
  await supabase
    .from("sermons")
    .update({ type: "apresentação", slides_source: "upload" })
    .eq("id", sermonId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, slidesCreated: inserted.length });
}
