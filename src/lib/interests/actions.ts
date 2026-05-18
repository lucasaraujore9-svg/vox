"use server";

// Server Action de "interesse de cadastro".
// Como o sistema é fechado (signup desligado no Supabase), quem tenta
// se cadastrar tem o interesse registrado em signup_interests pra o
// super admin avaliar depois.

import { z } from "zod";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  name: z.string().trim().min(2, "Nome muito curto").max(160).optional(),
  phone: z
    .string()
    .trim()
    .min(10, "Telefone muito curto")
    .max(30, "Telefone muito longo")
    .refine((v) => (v.match(/\d/g) ?? []).length >= 10, {
      message: "Inclua DDD e número completo",
    }),
  denomination: z.string().trim().max(160).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type InterestState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const INTEREST_COOLDOWN_KEYS = new Map<string, number>();

function checkCooldown(key: string): boolean {
  const now = Date.now();
  const last = INTEREST_COOLDOWN_KEYS.get(key);
  if (last && now - last < 60_000) return false; // 60s entre tentativas do mesmo IP/email
  INTEREST_COOLDOWN_KEYS.set(key, now);
  return true;
}

export async function submitInterestAction(
  _prev: InterestState,
  formData: FormData
): Promise<InterestState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    phone: formData.get("phone"),
    denomination: formData.get("denomination") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenZodErrors(parsed.error) };
  }

  // Captura IP/UA pra anti-abuso futuro
  const h = await headers();
  const sourceIp =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const sourceUa = h.get("user-agent")?.slice(0, 500) ?? null;

  // Cooldown leve por IP+email (anti-spam básico)
  const cooldownKey = `${sourceIp ?? "no-ip"}|${parsed.data.email}`;
  if (!checkCooldown(cooldownKey)) {
    // Resposta de sucesso pra não dar pistas a bots, mas não grava
    return { ok: true };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      ok: false,
      error:
        "Configuração do servidor incompleta. Tente novamente em alguns minutos.",
    };
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("signup_interests").insert({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      phone: parsed.data.phone,
      denomination: parsed.data.denomination ?? null,
      message: parsed.data.message ?? null,
      source_ip: sourceIp,
      source_ua: sourceUa,
    });
    if (error) {
      return {
        ok: false,
        error: "Não foi possível registrar seu interesse agora. Tente novamente.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível registrar seu interesse agora. Tente novamente.",
    };
  }
}

// === Admin actions ===

export async function updateInterestStatusAction(
  id: string,
  status: "pending" | "invited" | "rejected" | "spam",
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, error: "Supabase não configurado" };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const patch: {
    status: string;
    notes?: string;
    invited_at?: string;
  } = { status };
  if (notes !== undefined) patch.notes = notes;
  if (status === "invited") patch.invited_at = new Date().toISOString();

  const { error } = await supabase
    .from("signup_interests")
    .update(patch)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
