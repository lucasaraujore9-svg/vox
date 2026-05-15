"use server";

// Issue 045 — CRUD de séries.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Título obrigatório").max(240),
  description: z.string().trim().optional(),
});

export type SeriesActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertSeriesAction(input: z.input<typeof upsertSchema>): Promise<SeriesActionResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("series")
      .update({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
    revalidatePath("/series");
    return { ok: true, id: data.id };
  }

  const { data, error } = await supabase
    .from("series")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
  revalidatePath("/series");
  return { ok: true, id: data.id };
}

export async function deleteSeriesAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("series").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/series");
  redirect("/series");
}

export async function linkSermonToSeriesAction(
  sermonId: string,
  seriesId: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  const { error } = await supabase
    .from("sermons")
    .update({ series_id: seriesId })
    .eq("id", sermonId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/sermons/${sermonId}`);
  revalidatePath("/series");
  return { ok: true };
}
