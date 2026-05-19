// Server-side queries do módulo admin de IA.
// Server Component only. Não tem "use server" — não são actions.

import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin/queries";
import type {
  AISettings,
  ModelPrice,
  AIUsageReport,
  AIUserUsage,
  AIUsagePeriod,
} from "@/lib/admin/ai-types";

export async function getAISettingsForAdmin(): Promise<AISettings | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_settings")
    .select("active_model, model_prices, monthly_user_cap_usd")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    active_model: data.active_model,
    model_prices: data.model_prices as unknown as Record<string, ModelPrice>,
    monthly_user_cap_usd: Number(data.monthly_user_cap_usd ?? 0),
  };
}

export async function listAIUsage(
  period: AIUsagePeriod = "30d"
): Promise<AIUsageReport | null> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();

  let since: string | null = null;
  if (period === "30d") {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 30);
    since = d.toISOString();
  } else if (period === "month") {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    since = d.toISOString();
  }

  // Como agora as exegeses são compartilhadas globalmente, atribuímos
  // o custo ao usuário que GEROU (generated_by). Cache hits não custam
  // nada e não entram no relatório.
  let query = supabase
    .from("chapter_exegeses")
    .select(
      "id, generated_by, model, tokens_in, tokens_out, cost_usd, created_at"
    );
  if (since) query = query.gte("created_at", since);

  const { data: rows } = await query;
  const list = rows ?? [];

  const userAgg = new Map<
    string,
    {
      user_id: string;
      exegeses_count: number;
      tokens_in: number;
      tokens_out: number;
      cost_usd: number;
      last_used_at: string | null;
    }
  >();

  const modelAgg = new Map<string, { count: number; cost_usd: number }>();

  let totalIn = 0;
  let totalOut = 0;
  let totalCost = 0;

  for (const row of list) {
    if (!row.generated_by) continue; // pula órfãs
    totalIn += row.tokens_in ?? 0;
    totalOut += row.tokens_out ?? 0;
    totalCost += Number(row.cost_usd ?? 0);

    const u = userAgg.get(row.generated_by) ?? {
      user_id: row.generated_by,
      exegeses_count: 0,
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
      last_used_at: null as string | null,
    };
    u.exegeses_count += 1;
    u.tokens_in += row.tokens_in ?? 0;
    u.tokens_out += row.tokens_out ?? 0;
    u.cost_usd += Number(row.cost_usd ?? 0);
    if (!u.last_used_at || row.created_at > u.last_used_at) {
      u.last_used_at = row.created_at;
    }
    userAgg.set(row.generated_by, u);

    const m = modelAgg.get(row.model) ?? { count: 0, cost_usd: 0 };
    m.count += 1;
    m.cost_usd += Number(row.cost_usd ?? 0);
    modelAgg.set(row.model, m);
  }

  const userIds = Array.from(userAgg.keys());
  const profilesMap = new Map<string, { name: string | null }>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profilesMap.set(p.id, { name: p.name });
    }
  }

  const emailById = new Map<string, string>();
  if (userIds.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const service = createServiceClient();
      const { data: list } = await service.auth.admin.listUsers({
        perPage: 200,
      });
      for (const u of list?.users ?? []) {
        if (u.email && userIds.includes(u.id)) emailById.set(u.id, u.email);
      }
    } catch {
      // se Admin API falhar, segue sem emails
    }
  }

  const by_user: AIUserUsage[] = Array.from(userAgg.values())
    .map((u) => ({
      user_id: u.user_id,
      name: profilesMap.get(u.user_id)?.name ?? null,
      email: emailById.get(u.user_id) ?? "",
      exegeses_count: u.exegeses_count,
      tokens_in: u.tokens_in,
      tokens_out: u.tokens_out,
      cost_usd: u.cost_usd,
      last_used_at: u.last_used_at,
    }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  const by_model = Array.from(modelAgg.entries())
    .map(([model, m]) => ({
      model,
      count: m.count,
      cost_usd: m.cost_usd,
    }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  return {
    total_exegeses: list.length,
    total_tokens_in: totalIn,
    total_tokens_out: totalOut,
    total_cost_usd: totalCost,
    by_user,
    by_model,
  };
}
