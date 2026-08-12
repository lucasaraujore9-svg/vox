// Route Handler, upload de PDF (ou imagens) e conversão server-side em slides WebP.
// Issue 024 · ~50MB por arquivo, output 1280x720, salva no bucket privado sermon-slides.
// Os slides entram DEPOIS dos que já existem, nunca sobrescrevem a ordem anterior.

import { existsSync } from "node:fs";
import path from "node:path";
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

/** Raiz do pacote pdfjs dentro da função. Os assets (fontes, cmaps, wasm) são
 *  lidos do disco em Node, e vão pro bundle via outputFileTracingIncludes. */
const PDFJS_ROOT = path.join(process.cwd(), "node_modules", "pdfjs-dist");

/** Só passa a URL se o diretório realmente veio no pacote; senão pdfjs
 *  erra ao tentar buscar em vez de seguir sem o recurso. */
function assetDir(name: string): string | undefined {
  const dir = path.join(PDFJS_ROOT, name);
  return existsSync(dir) ? `${dir}${path.sep}` : undefined;
}

let workerRegistration: Promise<void> | null = null;

/**
 * Em Node o pdfjs roda o worker na própria thread e carrega `pdf.worker.mjs`
 * por import dinâmico com specifier calculado — o bundler não enxerga, o
 * arquivo não entra no pacote da função e o upload morre com
 * "Setting up fake worker failed: Cannot find module …/pdf.worker.mjs".
 * Registrar o módulo em `globalThis.pdfjsWorker` faz o pdfjs usar este import
 * estático, que o tracer enxerga.
 */
async function registerPdfWorker(): Promise<void> {
  workerRegistration ??= (async () => {
    const g = globalThis as typeof globalThis & { pdfjsWorker?: unknown };
    if (g.pdfjsWorker) return;
    g.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  })();
  return workerRegistration;
}

/** Canvas criado pelo próprio pdfjs. Tipado à mão: o .d.ts expõe como `Object`. */
interface PdfCanvasAndContext {
  canvas: { toBuffer(mime: "image/png"): Buffer } | null;
  context: unknown;
}
interface PdfCanvasFactory {
  create(width: number, height: number): PdfCanvasAndContext;
  destroy(canvasAndContext: PdfCanvasAndContext): void;
}

async function pdfToWebpBuffers(pdfBytes: ArrayBuffer): Promise<Buffer[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const sharp = (await import("sharp")).default;

  // Precisa vir antes do primeiro getDocument: o pdfjs resolve o worker uma
  // única vez por processo e guarda o resultado.
  await registerPdfWorker();

  // Sem system fonts na Lambda: usa os dados de fonte que vêm no próprio
  // pacote, senão texto não embutido no PDF sai em branco.
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes),
    standardFontDataUrl: assetDir("standard_fonts"),
    cMapUrl: assetDir("cmaps"),
    cMapPacked: true,
    wasmUrl: assetDir("wasm"),
  });
  const doc = await loadingTask.promise;

  // O canvas TEM que vir da fábrica do pdfjs. Ele carrega @napi-rs/canvas via
  // require() interno e usa esse mesmo módulo pra polyfillar globalThis.Path2D;
  // se importarmos o pacote por fora viram duas instâncias do módulo nativo e
  // o desenho de glifos quebra com "Value is none of these types String, Path".
  const canvasFactory = (doc as unknown as { canvasFactory?: PdfCanvasFactory })
    .canvasFactory;
  if (!canvasFactory) {
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

    const canvasAndContext = canvasFactory.create(
      Math.ceil(scaled.width),
      Math.ceil(scaled.height)
    );
    try {
      await page.render({
        canvas: canvasAndContext.canvas as unknown as HTMLCanvasElement,
        canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
        viewport: scaled,
      }).promise;

      const pngBuffer = canvasAndContext.canvas?.toBuffer("image/png");
      if (!pngBuffer) throw new Error(`Falha ao renderizar a página ${pageNum}`);
      const webp = await sharp(pngBuffer)
        .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "contain", background: "#ffffff" })
        .webp({ quality: 82 })
        .toBuffer();
      out.push(webp);
    } finally {
      page.cleanup();
      canvasFactory.destroy(canvasAndContext);
    }
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
