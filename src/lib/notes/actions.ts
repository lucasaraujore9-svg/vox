"use server";

// Server Actions de notas: CRUD + arquivar + apagar permanente + promover
// para sermão folha em branco.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emptyContentFor } from "@/lib/sermons/sessions";
import { stripHtml } from "@/lib/editor/html";
import type { Json } from "@/types/database";

export type MutationResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function demoBlocked<T = unknown>(verb: string): MutationResult<T> {
  return {
    ok: false,
    error: `Modo demo: configure Supabase em .env.local pra ${verb}.`,
  };
}

async function authed(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase não configurado" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  return { ok: true, supabase, userId: user.id };
}

const createSchema = z.object({
  title: z.string().trim().max(240).optional(),
  content: z.string().optional(),
});

export async function createNoteAction(
  input: z.infer<typeof createSchema> = {}
): Promise<MutationResult<{ id: string }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("criar notas");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data, error } = await auth.supabase
    .from("notes")
    .insert({
      user_id: auth.userId,
      title: parsed.data.title ?? "Nova nota",
      content: parsed.data.content ?? "",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao criar" };

  revalidatePath("/notes");
  return { ok: true, data: { id: data.id as string } };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(240).optional(),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
});

export async function updateNoteAction(
  input: z.infer<typeof updateSchema>
): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("atualizar notas");
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { id, ...patch } = parsed.data;
  const { error } = await auth.supabase
    .from("notes")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  return { ok: true };
}

export async function archiveNoteAction(id: string): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("arquivar notas");
  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  return { ok: true };
}

export async function unarchiveNoteAction(id: string): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("restaurar notas");
  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("notes")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  return { ok: true };
}

export async function permanentDeleteNoteAction(
  id: string
): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("apagar notas");
  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/notes");
  return { ok: true };
}

/**
 * Promove a nota para um sermão folha-em-branco: cria um sermão novo com o
 * conteúdo da nota como item inicial, e arquiva a nota original.
 */
export async function promoteNoteToSermonAction(
  noteId: string
): Promise<MutationResult<{ sermonId: string }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("promover notas");
  const auth = await authed();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: note, error: readError } = await auth.supabase
    .from("notes")
    .select("title, content")
    .eq("id", noteId)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (readError || !note) return { ok: false, error: "Nota não encontrada" };

  const skeleton = emptyContentFor("livre");
  // Coloca o conteúdo da nota no primeiro item da sessão livre
  if (skeleton.sessions[0] && skeleton.sessions[0].items[0]) {
    skeleton.sessions[0].items[0].content = note.content ?? "";
  }
  const wordCount = stripHtml(note.content ?? "")
    .split(/\s+/)
    .filter(Boolean).length;

  const { data: created, error: insertError } = await auth.supabase
    .from("sermons")
    .insert({
      user_id: auth.userId,
      title: note.title ?? "Sem título",
      framework: "livre",
      content_type: "sermão",
      type: "esboço",
      content: skeleton as unknown as Json,
      word_count: wordCount,
    })
    .select("id")
    .single();
  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? "Erro ao promover" };
  }

  // Arquiva a nota — não apaga, fica disponível em Arquivados
  await auth.supabase
    .from("notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", auth.userId);

  revalidatePath("/notes");
  revalidatePath("/sermons");
  return { ok: true, data: { sermonId: created.id as string } };
}
