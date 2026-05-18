// Leitura de notas, usado em Server Components.

import { createClient } from "@/lib/supabase/server";

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface NotesFilters {
  archived?: "active" | "archived" | "all";
  search?: string;
  limit?: number;
}

export async function listNotes(filters: NotesFilters = {}): Promise<NoteRow[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }
  const supabase = await createClient();
  let query = supabase
    .from("notes")
    .select("id, title, content, pinned, created_at, updated_at, archived_at")
    .is("deleted_at", null);

  const archived = filters.archived ?? "active";
  if (archived === "active") query = query.is("archived_at", null);
  else if (archived === "archived") query = query.not("archived_at", "is", null);

  if (filters.search) {
    // Busca simples ilike no título e conteúdo
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},content.ilike.${term}`);
  }

  // Pinned no topo, depois mais recentes
  query = query
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(filters.limit ?? 200);

  const { data, error } = await query;
  if (error) {
    console.error("listNotes error", error);
    return [];
  }
  return (data ?? []) as NoteRow[];
}

export async function getNote(id: string): Promise<NoteRow | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id, title, content, pinned, created_at, updated_at, archived_at")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as NoteRow | null) ?? null;
}
