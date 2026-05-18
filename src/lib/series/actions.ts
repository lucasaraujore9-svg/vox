"use server";

// CRUD de séries, incluindo árvore de pastas/subpastas (parent_id).

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Título obrigatório").max(240),
  description: z.string().trim().optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export type SeriesActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertSeriesAction(
  input: z.input<typeof upsertSchema>
): Promise<SeriesActionResult> {
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Impede pai = ela mesma (ciclo trivial).
  if (parsed.data.id && parsed.data.parent_id === parsed.data.id) {
    return { ok: false, error: "Uma série não pode ser sua própria pasta-pai." };
  }

  const patch = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    // parent_id: null limpa, undefined preserva (omite chave para update parcial).
    ...("parent_id" in parsed.data
      ? { parent_id: parsed.data.parent_id ?? null }
      : {}),
  };

  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("series")
      .update(patch)
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
    revalidatePath("/sermons");
    revalidatePath("/series");
    return { ok: true, id: data.id };
  }

  const { data, error } = await supabase
    .from("series")
    .insert({ ...patch, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
  revalidatePath("/sermons");
  revalidatePath("/series");
  return { ok: true, id: data.id };
}

const moveSchema = z.object({
  id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
});

export async function moveSeriesAction(
  input: z.input<typeof moveSchema>
): Promise<{ ok: boolean; error?: string }> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido" };
  }
  if (parsed.data.parent_id === parsed.data.id) {
    return { ok: false, error: "Uma série não pode ser sua própria pasta-pai." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Defesa contra ciclos: percorre a cadeia de ancestrais do destino;
  // se cair na própria série, recusa o move.
  if (parsed.data.parent_id) {
    const visited = new Set<string>();
    let cursor: string | null = parsed.data.parent_id;
    while (cursor) {
      if (cursor === parsed.data.id) {
        return { ok: false, error: "Movimento criaria um ciclo na árvore de pastas." };
      }
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const parentRes: { data: { parent_id: string | null } | null } =
        await supabase
          .from("series")
          .select("parent_id")
          .eq("id", cursor)
          .eq("user_id", user.id)
          .maybeSingle();
      cursor = parentRes.data?.parent_id ?? null;
    }
  }

  const { error } = await supabase
    .from("series")
    .update({ parent_id: parsed.data.parent_id })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sermons");
  return { ok: true };
}

export async function deleteSeriesAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  const { error } = await supabase
    .from("series")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sermons");
  return { ok: true };
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
  revalidatePath("/sermons");
  return { ok: true };
}
