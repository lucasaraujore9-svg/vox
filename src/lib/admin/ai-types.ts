// Types compartilhados do módulo admin de IA.
// Separados pra permitir import em Client e Server, sem conflitar com
// a diretiva "use server" que rege ai.ts (actions).

import type { AISettings, ModelPrice } from "@/lib/ai/client";

export type { AISettings, ModelPrice };

export interface AIUserUsage {
  user_id: string;
  name: string | null;
  email: string;
  exegeses_count: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  last_used_at: string | null;
}

export interface AIUsageReport {
  total_exegeses: number;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: number;
  by_user: AIUserUsage[];
  by_model: { model: string; count: number; cost_usd: number }[];
}

export type AIUsagePeriod = "30d" | "month" | "all";
