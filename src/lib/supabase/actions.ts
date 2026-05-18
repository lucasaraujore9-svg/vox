"use server";

// Server Actions de autenticação (Supabase Auth + tabela profiles).
// Issue 021. Validação com Zod, mensagens em PT-BR.

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const emailField = z.string().trim().email("Email inválido");
const passwordField = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres");

const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome muito curto"),
    denomination: z.string().trim().optional(),
    email: emailField,
    password: passwordField,
    confirmPassword: passwordField,
    terms: z.literal("on", {
      // RHF/FormData manda "on" quando checkbox marcado
      message: "Você precisa aceitar os termos",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email ou senha incorretos",
  user_already_exists: "Já existe uma conta com este email",
  email_not_confirmed:
    "Confirme seu email antes de entrar (verifique sua caixa de entrada)",
  weak_password: "Senha muito fraca, use ao menos 8 caracteres",
};

function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const friendly =
      FRIENDLY_AUTH_ERRORS[error.code ?? ""] ?? "Email ou senha incorretos";
    return { ok: false, error: friendly };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    denomination: formData.get("denomination") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenZodErrors(parsed.error) };
  }
  const { name, email, password, denomination } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) {
    const friendly =
      FRIENDLY_AUTH_ERRORS[error.code ?? ""] ??
      "Não foi possível criar a conta. Tente novamente.";
    return { ok: false, error: friendly };
  }

  // Trigger handle_new_user já criou a linha em profiles.
  // Atualiza denomination se preenchida.
  if (denomination && data.user?.id) {
    await supabase
      .from("profiles")
      .update({ denomination, name })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
