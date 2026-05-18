"use server";

// Server Actions de admin de IA (writes).
// Queries (reads) ficam em ai-queries.ts pra poder ser chamadas direto
// em Server Components sem o roundtrip de action.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin/queries";

const pricesSchema = z.record(
  z.string(),
  z.object({ input: z.number().min(0), output: z.number().min(0) })
);

const updateSchema = z.object({
  active_model: z.string().trim().min(2),
  model_prices: pricesSchema,
  monthly_user_cap_usd: z.number().min(0),
});

export async function updateAdminAISettingsAction(
  input: z.input<typeof updateSchema>
): Promise<{ ok: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return { ok: false, error: "Não autorizado" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  if (!parsed.data.model_prices[parsed.data.active_model]) {
    return {
      ok: false,
      error: "Modelo ativo precisa ter preço cadastrado",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("ai_settings")
    .update({
      active_model: parsed.data.active_model,
      model_prices: parsed.data.model_prices,
      monthly_user_cap_usd: parsed.data.monthly_user_cap_usd,
      updated_by: user.id,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ai");
  return { ok: true };
}
