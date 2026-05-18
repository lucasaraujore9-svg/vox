// Issue 038, registra um sermão como apresentação com fonte = Google Slides.
// Sem upload server-side: guarda apenas a URL.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ sermonId: z.string().uuid() });
const bodySchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.includes("docs.google.com/presentation"), {
      message: "URL precisa apontar para Google Slides",
    }),
});

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

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "URL inválida" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sermons")
    .update({
      type: "apresentação",
      slides_source: "google_slides",
      slides_url: parsed.data.url,
    })
    .eq("id", qs.data.sermonId)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
