// Queries de exegese (Server Components).
// RLS: usuário lê só as suas; admin lê tudo (pra relatório).

import { createClient } from "@/lib/supabase/server";

export interface ExegesisSummary {
  id: string;
  passage: string;
  version: string;
  content: string;
  created_at: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

export async function listExegesesForSermon(
  sermonId: string
): Promise<ExegesisSummary[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exegeses")
    .select(
      "id, passage, version, content, created_at, model, tokens_in, tokens_out, cost_usd"
    )
    .eq("sermon_id", sermonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    cost_usd: Number(row.cost_usd ?? 0),
  }));
}
