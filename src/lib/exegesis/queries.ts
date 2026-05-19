// Queries de exegese vinculadas a um sermão.
// JOIN sermon_exegeses → chapter_exegeses, retorna o conteúdo estruturado
// + status de geração (pra UI saber se está parcial).

import { createClient } from "@/lib/supabase/server";
import type {
  ExegesisContent,
  GroupKey,
} from "@/lib/ai/prompts/exegesis";

export interface ExegesisSummary {
  id: string;
  book_abbrev: string;
  book_name: string;
  chapter: number;
  canonical: string;
  content: ExegesisContent;
  generation_status: "partial" | "complete" | "failed";
  failed_groups: GroupKey[];
}

interface JoinRow {
  created_at: string;
  exegesis_id: string;
  chapter_exegeses: {
    id: string;
    book_abbrev: string;
    book_name: string;
    chapter: number;
    content: unknown;
    generation_status: "partial" | "complete" | "failed";
    failed_groups: string[];
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
      "created_at, exegesis_id, chapter_exegeses (id, book_abbrev, book_name, chapter, content, generation_status, failed_groups)"
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
      content: r.chapter_exegeses.content as ExegesisContent,
      generation_status: r.chapter_exegeses.generation_status,
      failed_groups: (r.chapter_exegeses.failed_groups ?? []) as GroupKey[],
    }));
}
