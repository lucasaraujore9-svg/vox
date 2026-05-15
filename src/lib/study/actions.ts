"use server";

// Issue 042 — Estudo guiado: progresso, notas, gerar output (sermão a partir de notas).

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createSermonAction } from "@/lib/sermons/actions";
import type { Json } from "@/types/database";

const saveSchema = z.object({
  moduleId: z.string().uuid(),
  notes: z.unknown(), // jsonb arbitrário (array de blocos)
  currentSession: z.number().int().min(1),
  progress: z.number().min(0).max(100),
});

export type ActionResult = { ok: boolean; error?: string };

export async function saveStudyProgressAction(
  input: z.input<typeof saveSchema>
): Promise<ActionResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("study_sessions")
    .upsert(
      {
        user_id: user.id,
        module_id: parsed.data.moduleId,
        notes_content: parsed.data.notes as Json,
        current_session: parsed.data.currentSession,
        progress: parsed.data.progress,
        completed_at: parsed.data.progress >= 100 ? new Date().toISOString() : null,
      },
      { onConflict: "user_id,module_id" }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/study/${parsed.data.moduleId}`);
  return { ok: true };
}

export async function generateFromStudyAction(
  moduleId: string,
  outputType: "sermão" | "palestra" | "aula"
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: session } = await supabase
    .from("study_sessions")
    .select("notes_content")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  const { data: module } = await supabase
    .from("study_modules")
    .select("title")
    .eq("id", moduleId)
    .maybeSingle();

  const created = await createSermonAction({
    title: `Manuscrito a partir de "${module?.title ?? "estudo"}"`,
    type: "esboço",
    content_type: outputType,
    framework: "livre",
  });
  if (!created.ok) return { ok: false, error: created.error };

  // Copia notes_content como base do conteúdo
  if (session?.notes_content) {
    await supabase
      .from("sermons")
      .update({ content: session.notes_content })
      .eq("id", created.id)
      .eq("user_id", user.id);
  }
  return { ok: true, id: created.id };
}
