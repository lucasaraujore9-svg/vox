"use server";

// Server Actions de exegese — cache global por capítulo+versão.
//
// Fluxo:
//   1. Normaliza passage → book + chapter (versículos descartados)
//   2. Tenta cache em chapter_exegeses (book_abbrev, chapter, version)
//      - HIT  : pula IA. Apenas vincula em sermon_exegeses.
//      - MISS : chama OpenAI Responses API com json_schema. Grava em
//               chapter_exegeses, depois vincula em sermon_exegeses.
//   3. Conta no cap mensal de IA SOMENTE em MISS (cache hit é grátis).

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
  EXEGESIS_JSON_SCHEMA,
  buildExegesisUserPrompt,
} from "@/lib/ai/prompts/exegesis";
import { normalizeChapter } from "@/lib/exegesis/normalize";

const createSchema = z.object({
  passage: z
    .string()
    .trim()
    .min(2, "Informe livro e capítulo")
    .max(200, "Passagem muito longa"),
  version: z.enum(["ARC", "ARA", "NVI", "NAA", "NVT"]),
  sermon_id: z.string().uuid().optional().nullable(),
});

export type CreateExegesisInput = z.input<typeof createSchema>;

export interface CreateExegesisResult {
  ok: boolean;
  id?: string;
  /** true se reutilizou cache (sem cobrança de IA). */
  cache_hit?: boolean;
  /** Forma canônica "Romanos 5" pra exibir em toast. */
  canonical?: string;
  error?: string;
}

export async function createExegesisAction(
  input: CreateExegesisInput
): Promise<CreateExegesisResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // Normaliza pra (book, chapter)
  const norm = normalizeChapter(parsed.data.passage);
  if (!norm.ok) return { ok: false, error: norm.message };
  const { book, chapter, canonical } = norm.value;

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

  // === Cache lookup ===
  const { data: cached } = await supabase
    .from("chapter_exegeses")
    .select("id")
    .eq("book_abbrev", book.abbrev)
    .eq("chapter", chapter)
    .eq("version", parsed.data.version)
    .maybeSingle();

  if (cached) {
    // Cache hit: vincula ao sermão (idempotente — PK composto)
    if (parsed.data.sermon_id) {
      await supabase
        .from("sermon_exegeses")
        .upsert(
          {
            sermon_id: parsed.data.sermon_id,
            exegesis_id: cached.id,
            user_id: user.id,
          },
          { onConflict: "sermon_id,exegesis_id" }
        );
      revalidatePath(`/sermons/${parsed.data.sermon_id}`);
    }
    return {
      ok: true,
      id: cached.id,
      cache_hit: true,
      canonical,
    };
  }

  // === Cache miss: gera via IA ===
  const settings = await loadAISettings();

  // Cap mensal por usuário (só conta MISS, hit é grátis)
  if (settings.monthly_user_cap_usd > 0) {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const { data: spent } = await supabase
      .from("chapter_exegeses")
      .select("cost_usd")
      .eq("generated_by", user.id)
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
      input: buildExegesisUserPrompt(book.name, chapter, parsed.data.version),
      text: {
        format: {
          type: "json_schema",
          ...EXEGESIS_JSON_SCHEMA,
        },
      },
      temperature: 0.3,
    });

    const raw = response.output_text;
    if (!raw) return { ok: false, error: "Resposta vazia da IA" };

    let contentJson: unknown;
    try {
      contentJson = JSON.parse(raw);
    } catch {
      return { ok: false, error: "IA retornou JSON inválido" };
    }

    const tokensIn = response.usage?.input_tokens ?? 0;
    const tokensOut = response.usage?.output_tokens ?? 0;
    const costUsd = computeCostUsd(
      settings.active_model,
      tokensIn,
      tokensOut,
      settings.model_prices
    );

    const { data: inserted, error } = await supabase
      .from("chapter_exegeses")
      .insert({
        book_abbrev: book.abbrev,
        book_name: book.name,
        chapter,
        version: parsed.data.version,
        content: contentJson as never,
        model: settings.active_model,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
        generated_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      // Pode ter race: outro usuário gerou no mesmo instante. Tenta ler de novo.
      const { data: retry } = await supabase
        .from("chapter_exegeses")
        .select("id")
        .eq("book_abbrev", book.abbrev)
        .eq("chapter", chapter)
        .eq("version", parsed.data.version)
        .maybeSingle();
      if (!retry) return { ok: false, error: error.message };
      if (parsed.data.sermon_id) {
        await supabase
          .from("sermon_exegeses")
          .upsert(
            {
              sermon_id: parsed.data.sermon_id,
              exegesis_id: retry.id,
              user_id: user.id,
            },
            { onConflict: "sermon_id,exegesis_id" }
          );
        revalidatePath(`/sermons/${parsed.data.sermon_id}`);
      }
      return { ok: true, id: retry.id, cache_hit: true, canonical };
    }

    if (parsed.data.sermon_id) {
      await supabase.from("sermon_exegeses").insert({
        sermon_id: parsed.data.sermon_id,
        exegesis_id: inserted.id,
        user_id: user.id,
      });
      revalidatePath(`/sermons/${parsed.data.sermon_id}`);
    }
    return { ok: true, id: inserted.id, cache_hit: false, canonical };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao chamar a IA",
    };
  }
}

/** Desvincula uma exegese do sermão (NÃO apaga do catálogo global). */
export async function unlinkExegesisFromSermonAction(
  sermon_id: string,
  exegesis_id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("sermon_exegeses")
    .delete()
    .eq("sermon_id", sermon_id)
    .eq("exegesis_id", exegesis_id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/sermons/${sermon_id}`);
  return { ok: true };
}
