"use server";

// Issue 041 — CRUD de cursos + linkagem de aulas.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(240),
  ementa: z.string().trim().nullable().optional(),
  objectives: z.array(z.string().trim()).default([]),
  hours: z.number().min(0).max(9999).nullable().optional(),
  status: z.enum(["rascunho", "pronto", "publicado"]).default("rascunho"),
  tags: z.array(z.string().trim()).default([]),
});

export type CourseActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function upsertCourseAction(
  input: z.input<typeof upsertSchema>
): Promise<CourseActionResult> {
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
      .from("courses")
      .update({
        title: parsed.data.title,
        ementa: parsed.data.ementa ?? null,
        objectives: parsed.data.objectives,
        hours: parsed.data.hours ?? null,
        status: parsed.data.status,
        tags: parsed.data.tags,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.id}`);
    return { ok: true, id: data.id };
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      ementa: parsed.data.ementa ?? null,
      objectives: parsed.data.objectives,
      hours: parsed.data.hours ?? null,
      status: parsed.data.status,
      tags: parsed.data.tags,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Erro" };
  revalidatePath("/courses");
  return { ok: true, id: data.id };
}

export async function linkLessonAction(
  courseId: string,
  sermonId: string,
  order: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("course_lessons")
    .upsert(
      { course_id: courseId, sermon_id: sermonId, order },
      { onConflict: "course_id,sermon_id" }
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export async function unlinkLessonAction(
  courseId: string,
  sermonId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("course_lessons")
    .delete()
    .eq("course_id", courseId)
    .eq("sermon_id", sermonId);
  revalidatePath(`/courses/${courseId}`);
}

export async function softDeleteCourseAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/courses");
}
