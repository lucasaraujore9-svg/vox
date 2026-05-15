// Endpoint usado pelo LinkPicker (wizard de criação) pra listar
// séries e cursos existentes do usuário. Resposta vazia se Supabase
// não configurado ou usuário não autenticado.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const empty = NextResponse.json({ series: [], courses: [] });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return empty;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const [seriesRes, coursesRes, lessonsRes] = await Promise.all([
      supabase
        .from("series")
        .select("id, title, sermon_count")
        .order("created_at", { ascending: false }),
      supabase
        .from("courses")
        .select("id, title")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("course_lessons").select("course_id"),
    ]);

    const lessonsByCourse = new Map<string, number>();
    for (const row of lessonsRes.data ?? []) {
      const cid = (row as { course_id: string }).course_id;
      lessonsByCourse.set(cid, (lessonsByCourse.get(cid) ?? 0) + 1);
    }

    return NextResponse.json({
      series: seriesRes.data ?? [],
      courses: (coursesRes.data ?? []).map((c) => ({
        id: c.id as string,
        title: c.title as string,
        lessons: lessonsByCourse.get(c.id as string) ?? 0,
      })),
    });
  } catch {
    return empty;
  }
}
