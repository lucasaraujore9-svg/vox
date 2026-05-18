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
// Lista alinhada com OpenAI pricing de mai/2026.
export const DEFAULT_MODEL = "gpt-5.4-mini";

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
  "gpt-5.5": { input: 5, output: 30 },
  "gpt-5.5-pro": { input: 30, output: 180 },
  "gpt-5.4": { input: 2.5, output: 15 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, output: 1.25 },
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  o3: { input: 2, output: 8 },
  "o3-pro": { input: 20, output: 80 },
  "o4-mini": { input: 1.1, output: 4.4 },
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
