// Issue 038, cria um slide vazio para começar uma apresentação manual.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ sermonId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const qs = querySchema.safeParse({
    sermonId: request.nextUrl.searchParams.get("sermonId"),
  });
  if (!qs.success) {
    return NextResponse.json({ error: "sermonId inválido" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Confere o sermão e descobre a próxima ordem disponível
  const { data: sermon } = await supabase
    .from("sermons")
    .select("id")
    .eq("id", qs.data.sermonId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sermon) return NextResponse.json({ error: "Sermão não encontrado" }, { status: 404 });

  const { data: lastSlide } = await supabase
    .from("slides")
    .select("order")
    .eq("sermon_id", qs.data.sermonId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (lastSlide?.order ?? 0) + 1;

  const { error: insertError } = await supabase.from("slides").insert({
    sermon_id: qs.data.sermonId,
    order: nextOrder,
    image_url: null,
    storage_path: null,
    comment: "",
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase
    .from("sermons")
    .update({ type: "apresentação", slides_source: "manual" })
    .eq("id", qs.data.sermonId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, order: nextOrder });
}
