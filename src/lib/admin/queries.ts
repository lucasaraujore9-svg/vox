// Queries usadas pela área /admin. Server-side only (Server Components).
// Checa admin via current_user_is_admin() — sem isso retorna lista vazia.

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  denomination: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminInterest {
  id: string;
  email: string;
  name: string | null;
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
    .select("id, name, role, denomination, created_at")
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
    denomination: p.denomination,
    created_at: p.created_at,
    email: emailById[p.id]?.email ?? "",
    last_sign_in_at: emailById[p.id]?.last_sign_in_at ?? null,
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
      "id, email, name, denomination, message, status, created_at, invited_at, notes"
    )
    .order("created_at", { ascending: false });

  if (filter && filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data } = await query;
  return data ?? [];
}

/** Conta interesses pendentes — usado pra badge na sidebar/menu. */
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
