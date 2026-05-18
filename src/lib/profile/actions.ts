"use server";

// Issue 046, Atualiza perfil + preferências + módulo IA + senha.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  denomination: z.string().trim().nullable().optional(),
  bible_version: z.enum(["ARC", "ARA", "NVI", "NAA", "NVT"]),
  ai_enabled: z.boolean(),
});

export type ActionResult = { ok: boolean; error?: string };

export async function updateProfileAction(
  input: z.input<typeof profileSchema>
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
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
      bible_version: parsed.data.bible_version,
      ai_enabled: parsed.data.ai_enabled,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

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

export async function deleteAccountAction(): Promise<ActionResult> {
  // Soft delete simbólico (cliente comum não pode dropar a conta auth.users).
  // Em prod: chama Route Handler que usa service role para auth.admin.deleteUser.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Marca todos os sermões como deletados
  await supabase
    .from("sermons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id);

  await supabase.auth.signOut();
  return { ok: true };
}
