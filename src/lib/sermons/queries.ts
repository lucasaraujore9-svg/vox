// Queries de leitura usadas em Server Components.
// Issue 030 / 032 / 049.

import { createClient } from "@/lib/supabase/server";

export interface SermonFilters {
  search?: string;
  framework?: string;
  contentType?: string;
  type?: string;
  seriesId?: string;
  bibleBook?: string;
  sort?: "recent" | "oldest" | "title" | "preached";
  limit?: number;
  offset?: number;
  /** Default "active" — exclui arquivados. "archived" mostra só arquivados. "all" mostra ambos. */
  archived?: "active" | "archived" | "all";
}

export async function listSermons(filters: SermonFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("sermons")
    .select(
      "id, title, framework, type, content_type, bible_ref, bible_book, status, tags, word_count, preached_at, updated_at, created_at, series_id, archived_at"
    )
    .is("deleted_at", null);

  const archived = filters.archived ?? "active";
  if (archived === "active") {
    query = query.is("archived_at", null);
  } else if (archived === "archived") {
    query = query.not("archived_at", "is", null);
  }

  if (filters.search) {
    // FTS column é search_vector — usar websearch_to_tsquery para busca natural
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "portuguese",
    });
  }
  if (filters.framework)
    query = query.eq("framework", filters.framework as never);
  if (filters.contentType)
    query = query.eq("content_type", filters.contentType as never);
  if (filters.type) query = query.eq("type", filters.type as never);
  if (filters.seriesId) query = query.eq("series_id", filters.seriesId);
  if (filters.bibleBook) query = query.eq("bible_book", filters.bibleBook);

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "preached":
      query = query.order("preached_at", { ascending: false, nullsFirst: false });
      break;
    case "recent":
    default:
      query = query.order("updated_at", { ascending: false });
  }

  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getSermon(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function dashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count: total }, { count: drafts }, lastPreachedResult] =
    await Promise.all([
      supabase
        .from("sermons")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase
        .from("sermons")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "rascunho"),
      supabase
        .from("sermons")
        .select("id, title, preached_at")
        .is("deleted_at", null)
        .not("preached_at", "is", null)
        .order("preached_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    total: total ?? 0,
    drafts: drafts ?? 0,
    lastPreached: lastPreachedResult.data ?? null,
  };
}
