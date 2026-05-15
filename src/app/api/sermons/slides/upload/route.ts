// Route Handler — upload de PDF e conversão server-side em slides WebP.
// Issue 024 · ~50MB max, output 1280x720, salva no bucket sermon-slides.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

const queryParamsSchema = z.object({
  sermonId: z.string().uuid("sermonId inválido"),
});

async function pdfToWebpBuffers(pdfBytes: ArrayBuffer): Promise<Buffer[]> {
  // pdfjs-dist precisa de canvas no Node — usa o reaper que vem com pdfjs-dist >= 4
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const sharp = (await import("sharp")).default;

  // Standard fonts são necessárias para evitar warnings de render
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  const out: Buffer[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scale = SLIDE_WIDTH / viewport.width;
    const scaled = page.getViewport({ scale });

    // Renderiza para um canvas via @napi-rs/canvas se disponível; senão, falha graciosa.
    let canvasMod: typeof import("@napi-rs/canvas") | null = null;
    try {
      canvasMod = await import("@napi-rs/canvas");
    } catch {
      throw new Error(
        "Para conversão PDF→WebP no servidor instale @napi-rs/canvas: `npm i @napi-rs/canvas`."
      );
    }
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

export async function POST(request: NextRequest) {
  const params = queryParamsSchema.safeParse({
    sermonId: request.nextUrl.searchParams.get("sermonId"),
  });
  if (!params.success) {
    return NextResponse.json(
      { error: params.error.flatten().fieldErrors },
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

  // Confere que o sermão é do usuário
  const { data: sermon } = await supabase
    .from("sermons")
    .select("id, type")
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sermon) {
    return NextResponse.json({ error: "Sermão não encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo excede 50MB" },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { error: "Por enquanto só PDFs são suportados. Para PPT, exporte como PDF antes." },
      { status: 415 }
    );
  }

  let webpBuffers: Buffer[];
  try {
    webpBuffers = await pdfToWebpBuffers(bytes);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Falha ao converter PDF em slides",
      },
      { status: 500 }
    );
  }

  // Upload e insert por slide
  const inserted: Array<{ order: number; image_url: string; storage_path: string }> = [];
  for (let i = 0; i < webpBuffers.length; i += 1) {
    const order = i + 1;
    const storagePath = `${user.id}/${sermonId}/slide-${String(order).padStart(3, "0")}.webp`;
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
    const { data: publicUrl } = supabase.storage
      .from("sermon-slides")
      .getPublicUrl(storagePath);
    inserted.push({
      order,
      image_url: publicUrl.publicUrl,
      storage_path: storagePath,
    });
  }

  // Insere registros na tabela slides
  const rows = inserted.map((s) => ({
    sermon_id: sermonId,
    order: s.order,
    image_url: s.image_url,
    storage_path: s.storage_path,
  }));
  const { error: insertError } = await supabase.from("slides").insert(rows);
  if (insertError) {
    return NextResponse.json(
      { error: `Falha ao salvar slides: ${insertError.message}` },
      { status: 500 }
    );
  }

  // Atualiza sermão como apresentação com slides_source = upload
  await supabase
    .from("sermons")
    .update({ type: "apresentação", slides_source: "upload" })
    .eq("id", sermonId);

  return NextResponse.json({ ok: true, slidesCreated: inserted.length });
}
