"use server";

// CRUD de pregações (sermon_engagements). Cada engagement é uma pregação real.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  sermonId: z.string().uuid(),
  preachedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  location: z.string().trim().max(200).optional(),
  audienceSize: z.number().int().min(0).max(1_000_000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().trim().max(5000).optional(),
});

export type EngagementResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function isDemoMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function upsertEngagement(
  input: z.input<typeof upsertSchema>
): Promise<EngagementResult> {
  if (isDemoMode()) {
    return {
      ok: false,
      error: "Modo demo: configure Supabase pra registrar pregações.",
    };
  }

  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const payload = {
    sermon_id: parsed.data.sermonId,
    user_id: user.id,
    preached_at: parsed.data.preachedAt,
    location: parsed.data.location ?? null,
    audience_size: parsed.data.audienceSize ?? null,
    rating: parsed.data.rating ?? null,
    feedback: parsed.data.feedback ?? null,
  };

  let id = parsed.data.id;
  if (id) {
    const { error } = await supabase
      .from("sermon_engagements")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("sermon_engagements")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
    id = data.id;
  }

  revalidatePath(`/sermons/${parsed.data.sermonId}`);
  revalidatePath("/dashboard");
  return { ok: true, id: id! };
}

export async function deleteEngagement(
  engagementId: string,
  sermonId: string
): Promise<{ ok: boolean; error?: string }> {
  if (isDemoMode()) {
    return { ok: false, error: "Modo demo." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  const { error } = await supabase
    .from("sermon_engagements")
    .delete()
    .eq("id", engagementId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/sermons/${sermonId}`);
  return { ok: true };
}

export async function listEngagements(sermonId: string) {
  if (isDemoMode()) return [] as Array<{
    id: string;
    preached_at: string;
    location: string | null;
    audience_size: number | null;
    rating: number | null;
    feedback: string | null;
  }>;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("sermon_engagements")
    .select("id, preached_at, location, audience_size, rating, feedback")
    .eq("sermon_id", sermonId)
    .eq("user_id", user.id)
    .order("preached_at", { ascending: false });
  return data ?? [];
}
