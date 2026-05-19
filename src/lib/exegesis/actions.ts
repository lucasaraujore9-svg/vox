"use server";

// Pipeline de exegese em 5 chamadas paralelas + pré-injeção de texto.
//
// 1. Normaliza passage → book + chapter
// 2. Cache global lookup (chapter_exegeses): se existe, vincula e retorna
// 3. Cap mensal por usuário (só conta MISS)
// 4. Busca o texto do capítulo na API.Bible (NVI → ACF fallback)
// 5. Dispara as 5 chamadas (texto · contexto · forma · background · sintese)
//    em paralelo, cada uma com schema JSON estrito próprio
// 6. Compõe o resultado: se TODAS sucesso → status='complete'; se SOME
//    falhou → 'partial' com failed_groups; se TODAS falharam → 'failed'
// 7. Grava em chapter_exegeses e vincula em sermon_exegeses

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getOpenAI,
  loadAISettings,
  computeCostUsd,
} from "@/lib/ai/client";
import {
  GROUP_A_SYSTEM,
  GROUP_A_SCHEMA,
  GROUP_B_SYSTEM,
  GROUP_B_SCHEMA,
  GROUP_C_SYSTEM,
  GROUP_C_SCHEMA,
  GROUP_D_SYSTEM,
  GROUP_D_SCHEMA,
  GROUP_E_SYSTEM,
  GROUP_E_SCHEMA,
  buildGroupAInput,
  buildGroupBInput,
  buildGroupCInput,
  buildGroupDInput,
  buildGroupEInput,
  emptyExegesisContent,
  type GroupKey,
  type ExegesisContent,
  type GroupAOutput,
  type GroupBOutput,
  type GroupCOutput,
  type GroupDOutput,
  type GroupEOutput,
} from "@/lib/ai/prompts/exegesis";
import { normalizeChapter } from "@/lib/exegesis/normalize";
import { fetchChapterAsContext } from "@/lib/exegesis/inject-text";

const EXEGESIS_VERSION = "ORIGINAL" as const;

const createSchema = z.object({
  passage: z
    .string()
    .trim()
    .min(2, "Informe livro e capítulo")
    .max(200, "Passagem muito longa"),
  sermon_id: z.string().uuid().optional().nullable(),
});

export type CreateExegesisInput = z.input<typeof createSchema>;

export interface CreateExegesisResult {
  ok: boolean;
  id?: string;
  cache_hit?: boolean;
  canonical?: string;
  /** Grupos que falharam (subset de [texto, contexto, forma, background, sintese]). */
  failed_groups?: GroupKey[];
  error?: string;
}

// ===========================================================================
// Helpers da chamada de cada grupo
// ===========================================================================

interface GroupCallResult<T> {
  output: T | null;
  tokensIn: number;
  tokensOut: number;
  error: string | null;
}

async function callGroup<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any
): Promise<GroupCallResult<T>> {
  try {
    const openai = getOpenAI();
    const response = await openai.responses.create({
      model,
      instructions: systemPrompt,
      input: userPrompt,
      text: {
        format: { type: "json_schema", ...schema },
      },
      temperature: 0.2,
    });
    const raw = response.output_text;
    if (!raw) {
      return {
        output: null,
        tokensIn: response.usage?.input_tokens ?? 0,
        tokensOut: response.usage?.output_tokens ?? 0,
        error: "Resposta vazia",
      };
    }
    let parsed: T;
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      return {
        output: null,
        tokensIn: response.usage?.input_tokens ?? 0,
        tokensOut: response.usage?.output_tokens ?? 0,
        error: "JSON inválido",
      };
    }
    return {
      output: parsed,
      tokensIn: response.usage?.input_tokens ?? 0,
      tokensOut: response.usage?.output_tokens ?? 0,
      error: null,
    };
  } catch (err) {
    return {
      output: null,
      tokensIn: 0,
      tokensOut: 0,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

// ===========================================================================
// Action principal
// ===========================================================================

export async function createExegesisAction(
  input: CreateExegesisInput
): Promise<CreateExegesisResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

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
    .eq("version", EXEGESIS_VERSION)
    .maybeSingle();

  if (cached) {
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
    return { ok: true, id: cached.id, cache_hit: true, canonical };
  }

  // === Cap mensal ===
  const settings = await loadAISettings();
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

  // === Pré-injeção de texto ===
  const chapterCtx = await fetchChapterAsContext(book.abbrev, chapter);
  const groupInput = {
    bookName: book.name,
    chapter,
    chapterText: chapterCtx?.text ?? null,
  };

  // === Disparo paralelo dos 5 grupos ===
  const [resA, resB, resC, resD, resE] = await Promise.all([
    callGroup<GroupAOutput>(
      settings.active_model,
      GROUP_A_SYSTEM,
      buildGroupAInput(groupInput),
      GROUP_A_SCHEMA
    ),
    callGroup<GroupBOutput>(
      settings.active_model,
      GROUP_B_SYSTEM,
      buildGroupBInput(groupInput),
      GROUP_B_SCHEMA
    ),
    callGroup<GroupCOutput>(
      settings.active_model,
      GROUP_C_SYSTEM,
      buildGroupCInput(groupInput),
      GROUP_C_SCHEMA
    ),
    callGroup<GroupDOutput>(
      settings.active_model,
      GROUP_D_SYSTEM,
      buildGroupDInput(groupInput),
      GROUP_D_SCHEMA
    ),
    callGroup<GroupEOutput>(
      settings.active_model,
      GROUP_E_SYSTEM,
      buildGroupEInput(groupInput),
      GROUP_E_SCHEMA
    ),
  ]);

  // === Compõe resultado ===
  const content = emptyExegesisContent();
  const failed: GroupKey[] = [];
  if (resA.output) content.pericope = resA.output.pericope;
  else failed.push("texto");
  if (resB.output) {
    content.contexto = resB.output.contexto;
    content.genero = resB.output.genero;
  } else failed.push("contexto");
  if (resC.output) {
    content.literario_estrutural = resC.output.literario_estrutural;
    content.gramatical_sintatico = resC.output.gramatical_sintatico;
    content.lexical = resC.output.lexical;
  } else failed.push("forma");
  if (resD.output) {
    content.historico_cultural = resD.output.historico_cultural;
    content.intertextualidade = resD.output.intertextualidade;
    content.teologico = resD.output.teologico;
  } else failed.push("background");
  if (resE.output) {
    content.historia_interpretacao = resE.output.historia_interpretacao;
    content.sintese = resE.output.sintese;
    content.principios_atemporais = resE.output.principios_atemporais;
    content.aplicacao = resE.output.aplicacao;
    content.metadados = resE.output.metadados;
  } else failed.push("sintese");

  const allFailed = failed.length === 5;
  if (allFailed) {
    const errs = [resA, resB, resC, resD, resE]
      .map((r) => r.error)
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");
    return {
      ok: false,
      error: `Falhou em todas as etapas. ${errs}`,
    };
  }

  // === Totalização de tokens + custo ===
  const totalIn =
    resA.tokensIn +
    resB.tokensIn +
    resC.tokensIn +
    resD.tokensIn +
    resE.tokensIn;
  const totalOut =
    resA.tokensOut +
    resB.tokensOut +
    resC.tokensOut +
    resD.tokensOut +
    resE.tokensOut;
  const costUsd = computeCostUsd(
    settings.active_model,
    totalIn,
    totalOut,
    settings.model_prices
  );

  const generationStatus = failed.length === 0 ? "complete" : "partial";

  const { data: inserted, error } = await supabase
    .from("chapter_exegeses")
    .insert({
      book_abbrev: book.abbrev,
      book_name: book.name,
      chapter,
      version: EXEGESIS_VERSION,
      content: content as unknown as never,
      model: settings.active_model,
      tokens_in: totalIn,
      tokens_out: totalOut,
      cost_usd: costUsd,
      generated_by: user.id,
      generation_status: generationStatus,
      failed_groups: failed,
    })
    .select("id")
    .single();

  if (error) {
    // Race condition: outro user já gerou a mesma chave
    const { data: retry } = await supabase
      .from("chapter_exegeses")
      .select("id")
      .eq("book_abbrev", book.abbrev)
      .eq("chapter", chapter)
      .eq("version", EXEGESIS_VERSION)
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

  return {
    ok: true,
    id: inserted.id,
    cache_hit: false,
    canonical,
    failed_groups: failed.length > 0 ? failed : undefined,
  };
}

// ===========================================================================
// Retry de um grupo específico (re-gera só o que falhou)
// ===========================================================================

export async function retryFailedGroupsAction(
  exegesisId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { data: row } = await supabase
    .from("chapter_exegeses")
    .select(
      "book_abbrev, book_name, chapter, content, failed_groups, tokens_in, tokens_out, cost_usd"
    )
    .eq("id", exegesisId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Exegese não encontrada" };

  const failedGroups = (row.failed_groups ?? []) as GroupKey[];
  if (failedGroups.length === 0) return { ok: true };

  const settings = await loadAISettings();
  const chapterCtx = await fetchChapterAsContext(row.book_abbrev, row.chapter);
  const groupInput = {
    bookName: row.book_name,
    chapter: row.chapter,
    chapterText: chapterCtx?.text ?? null,
  };

  const currentContent = row.content as unknown as ExegesisContent;
  const stillFailed: GroupKey[] = [];
  let extraIn = 0;
  let extraOut = 0;

  for (const group of failedGroups) {
    let result: GroupCallResult<unknown>;
    if (group === "texto") {
      result = await callGroup<GroupAOutput>(
        settings.active_model,
        GROUP_A_SYSTEM,
        buildGroupAInput(groupInput),
        GROUP_A_SCHEMA
      );
      if (result.output) {
        currentContent.pericope = (result.output as GroupAOutput).pericope;
      }
    } else if (group === "contexto") {
      result = await callGroup<GroupBOutput>(
        settings.active_model,
        GROUP_B_SYSTEM,
        buildGroupBInput(groupInput),
        GROUP_B_SCHEMA
      );
      if (result.output) {
        const out = result.output as GroupBOutput;
        currentContent.contexto = out.contexto;
        currentContent.genero = out.genero;
      }
    } else if (group === "forma") {
      result = await callGroup<GroupCOutput>(
        settings.active_model,
        GROUP_C_SYSTEM,
        buildGroupCInput(groupInput),
        GROUP_C_SCHEMA
      );
      if (result.output) {
        const out = result.output as GroupCOutput;
        currentContent.literario_estrutural = out.literario_estrutural;
        currentContent.gramatical_sintatico = out.gramatical_sintatico;
        currentContent.lexical = out.lexical;
      }
    } else if (group === "background") {
      result = await callGroup<GroupDOutput>(
        settings.active_model,
        GROUP_D_SYSTEM,
        buildGroupDInput(groupInput),
        GROUP_D_SCHEMA
      );
      if (result.output) {
        const out = result.output as GroupDOutput;
        currentContent.historico_cultural = out.historico_cultural;
        currentContent.intertextualidade = out.intertextualidade;
        currentContent.teologico = out.teologico;
      }
    } else {
      result = await callGroup<GroupEOutput>(
        settings.active_model,
        GROUP_E_SYSTEM,
        buildGroupEInput(groupInput),
        GROUP_E_SCHEMA
      );
      if (result.output) {
        const out = result.output as GroupEOutput;
        currentContent.historia_interpretacao = out.historia_interpretacao;
        currentContent.sintese = out.sintese;
        currentContent.principios_atemporais = out.principios_atemporais;
        currentContent.aplicacao = out.aplicacao;
        currentContent.metadados = out.metadados;
      }
    }
    extraIn += result.tokensIn;
    extraOut += result.tokensOut;
    if (!result.output) stillFailed.push(group);
  }

  const newTotalIn = (row.tokens_in ?? 0) + extraIn;
  const newTotalOut = (row.tokens_out ?? 0) + extraOut;
  const newCost =
    Number(row.cost_usd ?? 0) +
    computeCostUsd(
      settings.active_model,
      extraIn,
      extraOut,
      settings.model_prices
    );

  await supabase
    .from("chapter_exegeses")
    .update({
      content: currentContent as unknown as never,
      tokens_in: newTotalIn,
      tokens_out: newTotalOut,
      cost_usd: newCost,
      generation_status: stillFailed.length === 0 ? "complete" : "partial",
      failed_groups: stillFailed,
    })
    .eq("id", exegesisId);

  return { ok: true };
}

// ===========================================================================
// Desvincula uma exegese do sermão (NÃO apaga do catálogo global)
// ===========================================================================

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
