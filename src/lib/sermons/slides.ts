// Queries de slides, leitura server-side da tabela `slides`.
// Tolera comment_items legados (string ou null) via parseSermonContent.
// O bucket `sermon-slides` é PRIVATE: a imagem vem por signed URL gerada na
// leitura a partir de storage_path. `image_url` fica só para fontes externas
// (Google Slides) e para linhas legadas gravadas antes do bucket privado.

import { createClient } from "@/lib/supabase/server";
import { parseSermonContent, type SermonContent } from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";

/** Validade da signed URL. Longa o bastante pra uma pregação inteira. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 8;

export interface SlideRow {
  id: string;
  order: number;
  image_url?: string;
  storage_path?: string;
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
      .select("id, order, image_url, storage_path, comment_items")
      .eq("sermon_id", sermonId)
      .order("order", { ascending: true });

    const rows = (data ?? []).map((s) => ({
      id: s.id as string,
      order: s.order as number,
      image_url: (s.image_url as string | null) ?? undefined,
      storage_path: (s.storage_path as string | null) ?? undefined,
      comment_items: parseSermonContent(s.comment_items, framework),
    }));

    // Assina em lote os que moram no Storage.
    const paths = rows
      .map((r) => r.storage_path)
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("sermon-slides")
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      const byPath = new Map(
        (signed ?? [])
          .filter((s) => s.signedUrl && s.path)
          .map((s) => [s.path as string, s.signedUrl])
      );
      for (const row of rows) {
        if (row.storage_path) {
          const url = byPath.get(row.storage_path);
          if (url) row.image_url = url;
        }
      }
    }

    return rows;
  } catch {
    return [];
  }
}
