"use server";

// Server Actions de gestão de usuários.
// Só admin/super_admin podem rodar, checagem via current_user_is_admin().
// Cria usuário via Supabase Auth Admin API (service_role) + atualiza role
// + opcionalmente liga ao interesse origem (marca como invited).

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  password: z.string().min(8, "Senha precisa de ao menos 8 caracteres"),
  denomination: z.string().trim().max(160).optional(),
  role: z.enum(["pastor", "admin", "super_admin"]).default("pastor"),
  /** Se vier de um interesse, atualiza o status pra 'invited' */
  fromInterestId: z.string().uuid().optional(),
});

export type CreateUserResult =
  | { ok: true; id: string; email: string }
  | { ok: false; error: string };

async function assertAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { ok: false, error: "Acesso restrito a administradores" };
  }
  return { ok: true, userId: user.id };
}

export async function createUserAction(
  input: z.input<typeof createUserSchema>
): Promise<CreateUserResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const adminCheck = await assertAdmin();
  if (!adminCheck.ok) return adminCheck;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Configuração do servidor incompleta" };
  }

  // Cria usuário via Auth Admin API
  const authResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { name: parsed.data.name },
      }),
    }
  );

  if (!authResponse.ok) {
    const body = await authResponse.json().catch(() => null);
    const msg = body?.msg || body?.message || body?.error_description || `HTTP ${authResponse.status}`;
    return { ok: false, error: `Não foi possível criar: ${msg}` };
  }

  const created = (await authResponse.json()) as { id: string; email: string };

  // Atualiza role + denomination no profile (criado pelo trigger handle_new_user)
  const service = createServiceClient();
  await service
    .from("profiles")
    .update({
      role: parsed.data.role,
      name: parsed.data.name,
      denomination: parsed.data.denomination ?? null,
    })
    .eq("id", created.id);

  // Se veio de um interesse, marca como invited
  if (parsed.data.fromInterestId) {
    await service
      .from("signup_interests")
      .update({
        status: "invited",
        invited_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.fromInterestId);
  }

  revalidatePath("/admin/users");
  return { ok: true, id: created.id, email: created.email };
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin();
  if (!adminCheck.ok) return adminCheck;

  // Apenas super_admin pode promover pra admin/super_admin
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminCheck.userId)
    .maybeSingle();
  if (role !== "pastor" && me?.role !== "super_admin") {
    return { ok: false, error: "Apenas super_admin pode definir admin/super_admin" };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserPlanAction(
  userId: string,
  plan: "manuscrito" | "concilio"
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin();
  if (!adminCheck.ok) return adminCheck;

  if (plan !== "manuscrito" && plan !== "concilio") {
    return { ok: false, error: "Plano inválido" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Configuração do servidor incompleta" };
  }

  // Quem volta pra manuscrito perde IA automaticamente (mesma regra do user-self).
  const updates: { plan: string; ai_enabled?: boolean } = { plan };
  if (plan === "manuscrito") updates.ai_enabled = false;

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function setUserActiveAction(
  userId: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin();
  if (!adminCheck.ok) return adminCheck;

  if (adminCheck.userId === userId && !active) {
    return { ok: false, error: "Você não pode desativar a si mesmo." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Configuração do servidor incompleta" };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ is_active: active })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  // Quando desativa, força logout em todas as sessões ativas.
  if (!active) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}/logout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scope: "global" }),
        }
      );
    } catch {
      // Sessão será invalidada no próximo middleware check de qualquer forma.
    }
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}

export async function deleteUserAction(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const adminCheck = await assertAdmin();
  if (!adminCheck.ok) return adminCheck;

  if (adminCheck.userId === userId) {
    return { ok: false, error: "Você não pode excluir a si mesmo." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Configuração do servidor incompleta" };
  }

  // Apaga via Auth Admin (cascade vai limpar profile via FK)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}` };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
