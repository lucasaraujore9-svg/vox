// Issue 044, defaults canônicos das cores de bloco e Server Action de persistência.

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VOX_BLOCK_TYPES, type BlockTypeId } from "@/lib/mocks/blocks";

const HEX_OR_VAR = /^(#[0-9a-fA-F]{3,8}|rgba?\(.+\)|var\(--[\w-]+(?:,\s*.+)?\))$/;

const upsertSchema = z.object({
  preferences: z.array(
    z.object({
      block_type: z.string().min(1).max(64),
      color: z.string().regex(HEX_OR_VAR, "Cor inválida"),
    })
  ),
});

export type ColorMap = Record<BlockTypeId, string>;

export function defaultColors(): ColorMap {
  return VOX_BLOCK_TYPES.reduce((acc, block) => {
    acc[block.id] = block.color;
    return acc;
  }, {} as ColorMap);
}

export async function upsertBlockColors(
  preferences: Array<{ block_type: string; color: string }>
): Promise<{ ok: boolean; error?: string }> {
  const parsed = upsertSchema.safeParse({ preferences });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const rows = parsed.data.preferences.map((p) => ({
    user_id: user.id,
    block_type: p.block_type,
    color: p.color,
  }));

  const { error } = await supabase
    .from("block_color_preferences")
    .upsert(rows, { onConflict: "user_id,block_type" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/blocks");
  return { ok: true };
}

export async function loadBlockColors(): Promise<ColorMap> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaultColors();

  const { data } = await supabase
    .from("block_color_preferences")
    .select("block_type, color")
    .eq("user_id", user.id);

  const merged = defaultColors();
  for (const row of data ?? []) {
    if (row.block_type in merged) {
      merged[row.block_type as BlockTypeId] = row.color;
    }
  }
  return merged;
}
