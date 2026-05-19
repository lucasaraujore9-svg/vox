"use server";

// Issue 046, Atualiza perfil + preferências + módulo IA + senha.
// Cada aba de /settings tem sua própria action pra patch parcial e
// mensagens de erro localizadas.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

// === Perfil (Nome + Denominação) ===

const profileBasicSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  denomination: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export async function updateProfileBasicAction(
  input: z.input<typeof profileBasicSchema>
): Promise<ActionResult> {
  const parsed = profileBasicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      denomination: parsed.data.denomination ?? null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Preferências (Tradução padrão da bíblia) ===

const preferencesSchema = z.object({
  bible_version: z.enum(["ARC", "ARA", "NVI", "NAA", "NVT"]),
});

export async function updatePreferencesAction(
  input: z.input<typeof preferencesSchema>
): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ bible_version: parsed.data.bible_version })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// === IA (toggle ai_enabled) ===

const aiSchema = z.object({
  ai_enabled: z.boolean(),
});

export async function updateAISettingsAction(
  input: z.input<typeof aiSchema>
): Promise<ActionResult> {
  const parsed = aiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Gate: só pode ativar a IA quem está no plano Concílio
  if (parsed.data.ai_enabled) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.plan !== "concilio") {
      return {
        ok: false,
        error: "O assistente de IA faz parte do plano Concílio.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ai_enabled: parsed.data.ai_enabled })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Plano ===

const planSchema = z.object({
  plan: z.enum(["manuscrito", "concilio"]),
});

export async function updatePlanAction(
  input: z.input<typeof planSchema>
): Promise<ActionResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Manuscrito desliga a IA, Concílio liga — simetria pra evitar
  // upgrade com IA ainda desativada do estado anterior.
  const updates: { plan: string; ai_enabled: boolean } = {
    plan: parsed.data.plan,
    ai_enabled: parsed.data.plan === "concilio",
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Senha ===

const passwordSchema = z
  .object({
    new_password: z.string().min(8, "Senha precisa de ao menos 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ["confirm_password"],
    message: "As senhas não coincidem",
  });

export async function updatePasswordAction(
  input: z.input<typeof passwordSchema>
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// === Excluir conta (soft delete dos sermões + signOut) ===

export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  await supabase
    .from("sermons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await supabase.auth.signOut();
  return { ok: true };
}
