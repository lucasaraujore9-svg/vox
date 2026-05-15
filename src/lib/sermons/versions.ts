"use server";

// Server Actions de versionamento de esboço.
// saveVersion → snapshot. listVersions → histórico. restoreVersion → reverte o sermon ativo.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json, FrameworkId } from "@/types/database";

export type VersionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

interface SnapshotInput {
  sermonId: string;
  note?: string;
}

export async function saveSermonVersion(
  input: SnapshotInput
): Promise<VersionResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      ok: false,
      error: "Modo demo: versionamento exige Supabase configurado.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: sermon, error: readError } = await supabase
    .from("sermons")
    .select("title, framework, bible_ref, content, word_count")
    .eq("id", input.sermonId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !sermon) {
    return { ok: false, error: "Manuscrito não encontrado" };
  }

  const { data: version, error: insertError } = await supabase
    .from("sermon_versions")
    .insert({
      sermon_id: input.sermonId,
      user_id: user.id,
      title: sermon.title,
      framework: sermon.framework,
      bible_ref: sermon.bible_ref,
      content: sermon.content as Json,
      word_count: sermon.word_count ?? 0,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (insertError || !version) {
    return { ok: false, error: insertError?.message ?? "Erro ao salvar versão" };
  }

  revalidatePath(`/sermons/${input.sermonId}`);
  return { ok: true, id: version.id };
}

export async function listSermonVersions(sermonId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return [] as Array<{
      id: string;
      title: string;
      note: string | null;
      word_count: number;
      created_at: string;
    }>;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("sermon_versions")
    .select("id, title, note, word_count, created_at")
    .eq("sermon_id", sermonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getVersionDetail(versionId: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("sermon_versions")
    .select("*")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

export async function restoreSermonVersion(
  versionId: string
): Promise<{ ok: boolean; error?: string; sermonId?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Modo demo: configure Supabase pra restaurar versões." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: version, error: readError } = await supabase
    .from("sermon_versions")
    .select("sermon_id, title, framework, bible_ref, content, word_count")
    .eq("id", versionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !version) {
    return { ok: false, error: "Versão não encontrada" };
  }

  // Antes de restaurar, salva o estado atual como uma "auto-versão" pra não perder.
  await saveSermonVersion({
    sermonId: version.sermon_id,
    note: "Auto-snapshot antes de restaurar versão anterior",
  });

  const { error: updateError } = await supabase
    .from("sermons")
    .update({
      title: version.title,
      framework: (version.framework as FrameworkId) ?? "livre",
      bible_ref: version.bible_ref,
      content: version.content as Json,
      word_count: version.word_count,
    })
    .eq("id", version.sermon_id)
    .eq("user_id", user.id);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/sermons/${version.sermon_id}`);
  return { ok: true, sermonId: version.sermon_id };
}
