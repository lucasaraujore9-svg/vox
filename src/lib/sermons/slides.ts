// Queries de slides, leitura server-side da tabela `slides`.
// Tolera comment_items legados (string ou null) via parseSermonContent.

import { createClient } from "@/lib/supabase/server";
import { parseSermonContent, type SermonContent } from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";

export interface SlideRow {
  id: string;
  order: number;
  image_url?: string;
  comment_items: SermonContent;
}

export async function listSlidesForSermon(
  sermonId: string,
  framework: FrameworkId = "livre"
): Promise<SlideRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("slides")
      .select("id, order, image_url, comment_items")
      .eq("sermon_id", sermonId)
      .order("order", { ascending: true });
    return (data ?? []).map((s) => ({
      id: s.id as string,
      order: s.order as number,
      image_url: (s.image_url as string | null) ?? undefined,
      comment_items: parseSermonContent(s.comment_items, framework),
    }));
  } catch {
    return [];
  }
}
