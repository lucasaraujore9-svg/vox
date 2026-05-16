"use server";

// Server Actions de CRUD de conteúdo (sermão/palestra/aula).
// Issue 030 · auto-save acontece no client com upsert via createClient browser
// e fallback IndexedDB → sync. Aqui ficam as operações que precisam de Server Action.

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ContentType,
  FrameworkId,
  SermonStatus,
  SermonType,
} from "@/types/database";

const FRAMEWORKS: FrameworkId[] = [
  "expositivo",
  "textual",
  "narrativo",
  "tematico",
  "topico",
  "livre",
];

const createSchema = z.object({
  title: z.string().trim().min(1, "Título obrigatório").max(240),
  type: z.enum(["esboço", "apresentação"]),
  content_type: z.enum(["sermão", "palestra", "aula"]),
  framework: z.enum(FRAMEWORKS as [FrameworkId, ...FrameworkId[]]).optional(),
  bible_ref: z.string().trim().optional(),
  bible_book: z.string().trim().optional(),
  series_id: z.string().uuid().optional(),
});

export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createSermonAction(input: {
  title: string;
  type: SermonType;
  content_type: ContentType;
  framework?: FrameworkId;
  bible_ref?: string;
  bible_book?: string;
  series_id?: string;
}): Promise<CreateResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Dados inválidos" };
  }

  // Modo demo: sem Supabase configurado, redireciona pra um sermão mock
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      error:
        "Modo demo: configure Supabase em .env.local pra criar manuscritos novos. Abra um mock em /sermons pra testar o editor.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data, error } = await supabase
    .from("sermons")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      type: parsed.data.type,
      content_type: parsed.data.content_type,
      framework: parsed.data.framework ?? "livre",
      bible_ref: parsed.data.bible_ref ?? null,
      bible_book: parsed.data.bible_book ?? null,
      series_id: parsed.data.series_id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Erro ao criar" };
  }

  revalidatePath("/sermons");
  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export type MutationResult = { ok: true } | { ok: false; error: string };

function demoBlocked(verb: string): MutationResult {
  return {
    ok: false,
    error: `Modo demo: configure Supabase em .env.local pra ${verb}.`,
  };
}

async function getAuthedClient(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, error: "Supabase não configurado" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  return { ok: true, supabase, userId: user.id };
}

export async function archiveSermonAction(id: string): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("arquivar manuscritos");
  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("sermons")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sermons");
  revalidatePath("/dashboard");
  revalidatePath(`/sermons/${id}`);
  return { ok: true };
}

export async function unarchiveSermonAction(id: string): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("desarquivar manuscritos");
  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("sermons")
    .update({ archived_at: null })
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sermons");
  revalidatePath("/dashboard");
  revalidatePath(`/sermons/${id}`);
  return { ok: true };
}

/**
 * Apaga permanentemente. Só deveria ser oferecido a partir da lista de arquivados.
 * Não há retorno: a row deixa de existir.
 */
export async function permanentDeleteSermonAction(
  id: string
): Promise<MutationResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return demoBlocked("apagar manuscritos");
  const auth = await getAuthedClient();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("sermons")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sermons");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type SoftDeleteResult = MutationResult;

export async function softDeleteSermonAction(
  id: string
): Promise<SoftDeleteResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      error:
        "Modo demo: configure Supabase em .env.local pra mover manuscritos para a lixeira.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("sermons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/sermons");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function duplicateSermonAction(id: string): Promise<CreateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: source, error: readError } = await supabase
    .from("sermons")
    .select(
      "title, type, content_type, framework, bible_ref, bible_book, status, series_id, tags, content, word_count"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError || !source) {
    return { ok: false, error: "Conteúdo original não encontrado" };
  }

  const { data: created, error: insertError } = await supabase
    .from("sermons")
    .insert({
      user_id: user.id,
      title: `${source.title} (cópia)`,
      type: source.type,
      content_type: source.content_type,
      framework: source.framework,
      bible_ref: source.bible_ref,
      bible_book: source.bible_book,
      status: "rascunho" as SermonStatus,
      series_id: source.series_id,
      tags: source.tags,
      content: source.content,
      word_count: source.word_count,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? "Erro ao duplicar" };
  }

  revalidatePath("/sermons");
  return { ok: true, id: created.id };
}

const updateMetaSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(240).optional(),
  bible_ref: z.string().trim().nullable().optional(),
  bible_book: z.string().trim().nullable().optional(),
  status: z.enum(["rascunho", "pronto"]).optional(),
  tags: z.array(z.string().trim()).optional(),
  preached_at: z.string().nullable().optional(),
  series_id: z.string().uuid().nullable().optional(),
});

export async function updateSermonMetaAction(
  input: z.infer<typeof updateMetaSchema>
): Promise<{ ok: boolean; error?: string }> {
  const parsed = updateMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const { id, ...patch } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("sermons")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/sermons/${id}`);
  return { ok: true };
}

export async function publishSermonAction(id: string): Promise<void> {
  await updateSermonMetaAction({ id, status: "pronto" });
  redirect(`/sermons/${id}`);
}
