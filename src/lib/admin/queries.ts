// Queries usadas pela área /admin. Server-side only (Server Components).
// Checa admin via current_user_is_admin(), sem isso retorna lista vazia.

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  is_active: boolean;
  denomination: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminUserSermon {
  id: string;
  title: string;
  framework: string;
  content_type: string | null;
  bible_ref: string | null;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUserExegesis {
  id: string;
  book_name: string;
  chapter: number;
  version: string;
  model: string;
  cost_usd: number;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
  sermon_id: string | null;
  sermon_title: string | null;
}

export interface AdminInterest {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  denomination: string | null;
  message: string | null;
  status: string;
  created_at: string;
  invited_at: string | null;
  notes: string | null;
}

export async function listUsers(): Promise<AdminUser[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "super_admin")) return [];

  // Lista profiles (RLS deixa admin ler todos)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role, plan, is_active, denomination, created_at")
    .order("created_at", { ascending: false });
  if (!profiles) return [];

  // Email + last_sign_in_at vem de auth.users via Admin API
  let emailById: Record<string, { email: string; last_sign_in_at: string | null }> = {};
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=200`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          cache: "no-store",
        }
      );
      if (response.ok) {
        const body = (await response.json()) as {
          users: Array<{ id: string; email?: string; last_sign_in_at?: string | null }>;
        };
        emailById = Object.fromEntries(
          body.users.map((u) => [
            u.id,
            {
              email: u.email ?? "",
              last_sign_in_at: u.last_sign_in_at ?? null,
            },
          ])
        );
      }
    } catch {
      // se Admin API falhar, segue com profiles sem email
    }
  }

  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    plan: p.plan,
    is_active: p.is_active,
    denomination: p.denomination,
    created_at: p.created_at,
    email: emailById[p.id]?.email ?? "",
    last_sign_in_at: emailById[p.id]?.last_sign_in_at ?? null,
  }));
}

/** Detalhe completo de um usuário, para a página /admin/users/[id]. */
export async function getAdminUserDetail(
  userId: string
): Promise<AdminUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "super_admin")) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, plan, is_active, denomination, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  let email = "";
  let last_sign_in_at: string | null = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
          cache: "no-store",
        }
      );
      if (response.ok) {
        const body = (await response.json()) as {
          email?: string;
          last_sign_in_at?: string | null;
        };
        email = body.email ?? "";
        last_sign_in_at = body.last_sign_in_at ?? null;
      }
    } catch {
      // ignore
    }
  }

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    plan: profile.plan,
    is_active: profile.is_active,
    denomination: profile.denomination,
    created_at: profile.created_at,
    email,
    last_sign_in_at,
  };
}

/** Sermões de um usuário (admin enxerga via service_role; RLS limita owner). */
export async function listUserSermons(
  userId: string
): Promise<AdminUserSermon[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "super_admin")) return [];

  // Service role pra ver sermões de qualquer usuário (RLS limita ao dono).
  const service = createServiceClient();
  const { data } = await service
    .from("sermons")
    .select(
      "id, title, framework, content_type, bible_ref, status, word_count, created_at, updated_at"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    framework: s.framework,
    content_type: (s as { content_type?: string | null }).content_type ?? null,
    bible_ref: s.bible_ref,
    status: s.status,
    word_count: s.word_count,
    created_at: s.created_at,
    updated_at: s.updated_at,
  }));
}

/** Exegeses solicitadas por um usuário (via sermon_exegeses + chapter_exegeses). */
export async function listUserExegeses(
  userId: string
): Promise<AdminUserExegesis[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || (me.role !== "admin" && me.role !== "super_admin")) return [];

  const service = createServiceClient();

  // Pega vínculos do usuário com chapter_exegeses + sermão
  const { data: links } = await service
    .from("sermon_exegeses")
    .select(
      "sermon_id, exegesis_id, created_at, chapter_exegeses(book_name, chapter, version, model, cost_usd, tokens_in, tokens_out), sermons(title)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  type LinkRow = {
    sermon_id: string;
    exegesis_id: string;
    created_at: string;
    chapter_exegeses:
      | {
          book_name: string;
          chapter: number;
          version: string;
          model: string;
          cost_usd: number | string;
          tokens_in: number;
          tokens_out: number;
        }
      | null;
    sermons: { title: string } | null;
  };

  return ((links ?? []) as unknown as LinkRow[])
    .filter((row) => row.chapter_exegeses !== null)
    .map((row) => ({
      id: row.exegesis_id,
      book_name: row.chapter_exegeses!.book_name,
      chapter: row.chapter_exegeses!.chapter,
      version: row.chapter_exegeses!.version,
      model: row.chapter_exegeses!.model,
      cost_usd: Number(row.chapter_exegeses!.cost_usd ?? 0),
      tokens_in: row.chapter_exegeses!.tokens_in,
      tokens_out: row.chapter_exegeses!.tokens_out,
      created_at: row.created_at,
      sermon_id: row.sermon_id,
      sermon_title: row.sermons?.title ?? null,
    }));
}

export async function listInterests(
  filter?: "all" | "pending" | "invited" | "rejected" | "spam"
): Promise<AdminInterest[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("signup_interests")
    .select(
      "id, email, name, phone, denomination, message, status, created_at, invited_at, notes"
    )
    .order("created_at", { ascending: false });

  if (filter && filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data } = await query;
  return data ?? [];
}

/** Conta interesses pendentes, usado pra badge na sidebar/menu. */
export async function pendingInterestCount(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return 0;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("signup_interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/** Detecta se é admin sem expor o role. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return data?.role === "admin" || data?.role === "super_admin";
}
