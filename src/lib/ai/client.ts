// Singleton da OpenAI. Usar SOMENTE em Route Handlers / Server Actions.
// Verificação de profile.ai_enabled / plan='concilio' deve preceder cada chamada.

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!cached) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurado");
    }
    cached = new OpenAI({ apiKey });
  }
  return cached;
}

// Fallback hard-coded caso o registro singleton ainda não exista.
// O super admin sobrescreve isso pelo /admin/ai.
export const DEFAULT_MODEL = "gpt-4o";

export interface ModelPrice {
  /** USD por 1M de tokens de entrada */
  input: number;
  /** USD por 1M de tokens de saída */
  output: number;
}

export interface AISettings {
  active_model: string;
  model_prices: Record<string, ModelPrice>;
  monthly_user_cap_usd: number;
}

const DEFAULT_PRICES: Record<string, ModelPrice> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};

const DEFAULT_AI_SETTINGS: AISettings = {
  active_model: DEFAULT_MODEL,
  model_prices: DEFAULT_PRICES,
  monthly_user_cap_usd: 5,
};

/** Lê a config global da IA. Fallback pros defaults se a tabela não existe. */
export async function loadAISettings(): Promise<AISettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return DEFAULT_AI_SETTINGS;
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_settings")
    .select("active_model, model_prices, monthly_user_cap_usd")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULT_AI_SETTINGS;
  return {
    active_model: data.active_model ?? DEFAULT_MODEL,
    model_prices:
      (data.model_prices as unknown as Record<string, ModelPrice>) ??
      DEFAULT_PRICES,
    monthly_user_cap_usd: Number(data.monthly_user_cap_usd ?? 5),
  };
}

/** Calcula custo de uma chamada em USD a partir dos tokens. */
export function computeCostUsd(
  model: string,
  tokensIn: number,
  tokensOut: number,
  prices: Record<string, ModelPrice>
): number {
  const p = prices[model] ?? DEFAULT_PRICES[model];
  if (!p) return 0;
  const cost = (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
