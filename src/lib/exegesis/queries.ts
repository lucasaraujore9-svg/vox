// Queries de exegese vinculadas a um sermão.
// Faz JOIN sermon_exegeses → chapter_exegeses, retornando o conteúdo estruturado.

import { createClient } from "@/lib/supabase/server";
import type { ExegesisContent } from "@/lib/ai/prompts/exegesis";

export interface ExegesisSummary {
  id: string;
  book_abbrev: string;
  book_name: string;
  chapter: number;
  canonical: string;
  version: string;
  content: ExegesisContent;
  created_at: string;
  linked_at: string;
  model: string;
}

interface JoinRow {
  created_at: string;
  exegesis_id: string;
  chapter_exegeses: {
    id: string;
    book_abbrev: string;
    book_name: string;
    chapter: number;
    version: string;
    content: unknown;
    model: string;
    created_at: string;
  } | null;
}

export async function listExegesesForSermon(
  sermonId: string
): Promise<ExegesisSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("sermon_exegeses")
    .select(
      "created_at, exegesis_id, chapter_exegeses (id, book_abbrev, book_name, chapter, version, content, model, created_at)"
    )
    .eq("sermon_id", sermonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as JoinRow[];

  return rows
    .filter((r): r is JoinRow & { chapter_exegeses: NonNullable<JoinRow["chapter_exegeses"]> } =>
      r.chapter_exegeses !== null
    )
    .map((r) => ({
      id: r.chapter_exegeses.id,
      book_abbrev: r.chapter_exegeses.book_abbrev,
      book_name: r.chapter_exegeses.book_name,
      chapter: r.chapter_exegeses.chapter,
      canonical: `${r.chapter_exegeses.book_name} ${r.chapter_exegeses.chapter}`,
      version: r.chapter_exegeses.version,
      content: r.chapter_exegeses.content as ExegesisContent,
      created_at: r.chapter_exegeses.created_at,
      linked_at: r.created_at,
      model: r.chapter_exegeses.model,
    }));
}
