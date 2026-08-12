// Ações sobre um slide específico.
//   DELETE → apaga o slide, o arquivo no Storage e renumera os que sobraram.
//   PUT    → substitui a imagem do slide (PDF de 1 página, PNG, JPG ou WebP).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

const paramsSchema = z.object({ slideId: z.string().uuid() });

interface OwnedSlide {
  id: string;
  sermon_id: string;
  order: number;
  storage_path: string | null;
}

/** Carrega o slide garantindo que o sermão pertence ao usuário logado. */
async function loadOwnedSlide(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slideId: string,
  userId: string
): Promise<OwnedSlide | null> {
  const { data } = await supabase
    .from("slides")
    .select("id, sermon_id, order, storage_path, sermons!inner(user_id)")
    .eq("id", slideId)
    .maybeSingle();
  if (!data) return null;
  const owner = (data as unknown as { sermons?: { user_id?: string } | null })
    .sermons?.user_id;
  if (owner && owner !== userId) return null;
  return {
    id: data.id as string,
    sermon_id: data.sermon_id as string,
    order: data.order as number,
    storage_path: (data.storage_path as string | null) ?? null,
  };
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slideId: string }> }
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "slideId inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const slide = await loadOwnedSlide(supabase, parsed.data.slideId, user.id);
  if (!slide) {
    return NextResponse.json({ error: "Slide não encontrado" }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("slides")
    .delete()
    .eq("id", slide.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (slide.storage_path) {
    // Falha aqui não invalida a exclusão: o registro já saiu.
    await supabase.storage.from("sermon-slides").remove([slide.storage_path]);
  }

  // Renumera os que ficaram, pra não deixar buraco na sequência.
  const { data: rest } = await supabase
    .from("slides")
    .select("id, order")
    .eq("sermon_id", slide.sermon_id)
    .order("order", { ascending: true });
  let next = 1;
  for (const row of rest ?? []) {
    if ((row.order as number) !== next) {
      await supabase
        .from("slides")
        .update({ order: next })
        .eq("id", row.id as string);
    }
    next += 1;
  }

  return NextResponse.json({ ok: true, remaining: rest?.length ?? 0 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slideId: string }> }
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "slideId inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const slide = await loadOwnedSlide(supabase, parsed.data.slideId, user.id);
  if (!slide) {
    return NextResponse.json({ error: "Slide não encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo passa de 50MB" }, { status: 413 });
  }

  const name = file.name.toLowerCase();
  const isImage =
    file.type.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp"].some((e) => name.endsWith(e));
  if (!isImage) {
    return NextResponse.json(
      { error: "Envie uma imagem (PNG, JPG ou WebP) para substituir o slide." },
      { status: 415 }
    );
  }

  let webp: Buffer;
  try {
    const sharp = (await import("sharp")).default;
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "Não consegui ler essa imagem" },
      { status: 422 }
    );
  }

  const batch = crypto.randomUUID().slice(0, 8);
  const storagePath = `${user.id}/${slide.sermon_id}/${batch}-${String(slide.order).padStart(3, "0")}.webp`;
  const uploadRes = await supabase.storage
    .from("sermon-slides")
    .upload(storagePath, webp, { contentType: "image/webp", upsert: true });
  if (uploadRes.error) {
    return NextResponse.json({ error: uploadRes.error.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("slides")
    .update({ image_url: null, storage_path: storagePath })
    .eq("id", slide.id);
  if (updateError) {
    await supabase.storage.from("sermon-slides").remove([storagePath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Remove o arquivo antigo só depois que o novo já está apontado.
  if (slide.storage_path && slide.storage_path !== storagePath) {
    await supabase.storage.from("sermon-slides").remove([slide.storage_path]);
  }

  return NextResponse.json({ ok: true });
}
