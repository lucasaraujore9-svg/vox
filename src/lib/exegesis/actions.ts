"use server";

// Server Actions de exegese.
// Gate: requer plan='concilio' E ai_enabled=true antes de chamar OpenAI.
// Cap mensal: respeita ai_settings.monthly_user_cap_usd por usuário.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAI,
  loadAISettings,
  computeCostUsd,
} from "@/lib/ai/client";
import {
  EXEGESIS_SYSTEM_PROMPT,
  buildExegesisUserPrompt,
} from "@/lib/ai/prompts/exegesis";

const createSchema = z.object({
  passage: z
    .string()
    .trim()
    .min(2, "Informe a passagem")
    .max(200, "Passagem muito longa"),
  version: z.enum(["ARC", "ARA", "NVI", "NAA", "NVT"]),
  sermon_id: z.string().uuid().optional().nullable(),
});

export type CreateExegesisInput = z.input<typeof createSchema>;

export interface CreateExegesisResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createExegesisAction(
  input: CreateExegesisInput
): Promise<CreateExegesisResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, ai_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Perfil não encontrado" };
  if (profile.plan !== "concilio") {
    return {
      ok: false,
      error:
        "Exegese assistida faz parte do plano Concílio. Mude o plano em /settings.",
    };
  }
  if (!profile.ai_enabled) {
    return {
      ok: false,
      error: "Ative o assistente em /settings para usar a exegese.",
    };
  }

  const settings = await loadAISettings();

  // Cap mensal por usuário
  if (settings.monthly_user_cap_usd > 0) {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const { data: spent } = await supabase
      .from("exegeses")
      .select("cost_usd")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());
    const total =
      spent?.reduce((acc, row) => acc + Number(row.cost_usd ?? 0), 0) ?? 0;
    if (total >= settings.monthly_user_cap_usd) {
      return {
        ok: false,
        error: `Limite mensal de US$ ${settings.monthly_user_cap_usd.toFixed(2)} atingido. Fale com o admin pra liberar mais.`,
      };
    }
  }

  try {
    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: settings.active_model,
      instructions: EXEGESIS_SYSTEM_PROMPT,
      input: buildExegesisUserPrompt(
        parsed.data.passage,
        parsed.data.version
      ),
      temperature: 0.5,
    });

    const content = response.output_text;
    if (!content) return { ok: false, error: "Resposta vazia da IA" };

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;
    const costUsd = computeCostUsd(
      settings.active_model,
      tokensIn,
      tokensOut,
      settings.model_prices
    );

    const { data: inserted, error } = await supabase
      .from("exegeses")
      .insert({
        user_id: user.id,
        sermon_id: parsed.data.sermon_id ?? null,
        passage: parsed.data.passage,
        version: parsed.data.version,
        content,
        model: settings.active_model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    if (parsed.data.sermon_id) {
      revalidatePath(`/sermons/${parsed.data.sermon_id}`);
    }
    return { ok: true, id: inserted.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao chamar a IA",
    };
  }
}

export async function deleteExegesisAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: row } = await supabase
    .from("exegeses")
    .select("sermon_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("exegeses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  if (row?.sermon_id) revalidatePath(`/sermons/${row.sermon_id}`);
  return { ok: true };
}
