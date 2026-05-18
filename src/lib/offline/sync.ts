// Sync de mudanças offline → Supabase quando volta online.
// Estratégia de conflito no MVP: last-write-wins comparando updated_at.

import { listPending, markSynced, clearSynced } from "./db";
import { createClient } from "@/lib/supabase/client";
import type { TablesUpdate } from "@/types/database";

export interface SyncResult {
  attempted: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; message: string }>;
}

export async function syncPendingSermons(): Promise<SyncResult> {
  const result: SyncResult = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // Sem Supabase configurado, não há pra onde sincronizar, no-op
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return result;
  }

  const pending = await listPending();
  result.attempted = pending.length;
  if (pending.length === 0) return result;

  const supabase = createClient();

  for (const record of pending) {
    try {
      // Confere remote updated_at, last-write-wins
      const { data: remote } = await supabase
        .from("sermons")
        .select("updated_at")
        .eq("id", record.id)
        .maybeSingle();

      const remoteTimestamp = remote?.updated_at ?? null;
      const localTimestamp = record.updated_at;

      if (!remoteTimestamp || localTimestamp >= remoteTimestamp) {
        // O hook useAutoSave guarda o SermonContent ({ sessions: [...] }) cru,
        // aqui envolvemos no campo `content` da tabela.
        const update: TablesUpdate<"sermons"> = {
          content: record.payload as TablesUpdate<"sermons">["content"],
        };
        const { error } = await supabase
          .from("sermons")
          .update(update)
          .eq("id", record.id);
        if (error) throw error;
      }
      // Caso contrário, remote venceu, descarta o local.

      await markSynced(record.id);
      result.succeeded += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({
        id: record.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await clearSynced();
  return result;
}
