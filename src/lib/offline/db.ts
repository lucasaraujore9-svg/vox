// IndexedDB para sync offline-first.
// Sermons em edição são gravados aqui antes (ou em paralelo) de irem para o Supabase.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DB_NAME = "vox-offline";
const DB_VERSION = 1;

export interface PendingSermonRecord {
  id: string;
  payload: Record<string, unknown>;
  updated_at: string;
  synced: boolean;
}

interface VoxOfflineDB extends DBSchema {
  pending_sermons: {
    key: string;
    value: PendingSermonRecord;
    indexes: { "by-synced": "0" | "1" };
  };
  cached_sermons: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      cached_at: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VoxOfflineDB>> | null = null;

function getDb(): Promise<IDBPDatabase<VoxOfflineDB>> {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB indisponível fora do browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<VoxOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("pending_sermons")) {
          const store = db.createObjectStore("pending_sermons", { keyPath: "id" });
          store.createIndex("by-synced", "synced", { unique: false });
        }
        if (!db.objectStoreNames.contains("cached_sermons")) {
          db.createObjectStore("cached_sermons", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function savePending(
  id: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  await db.put("pending_sermons", {
    id,
    payload,
    updated_at: new Date().toISOString(),
    synced: false,
  });
}

export async function listPending(): Promise<PendingSermonRecord[]> {
  const db = await getDb();
  const all = await db.getAll("pending_sermons");
  return all.filter((record) => !record.synced);
}

/** Recupera o conteúdo pendente (não sincronizado) de um sermão pelo id. */
export async function getPending(
  id: string
): Promise<PendingSermonRecord | null> {
  if (typeof window === "undefined") return null;
  const db = await getDb();
  const record = await db.get("pending_sermons", id);
  if (!record || record.synced) return null;
  return record;
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDb();
  const record = await db.get("pending_sermons", id);
  if (!record) return;
  record.synced = true;
  await db.put("pending_sermons", record);
}

export async function clearSynced(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("pending_sermons", "readwrite");
  const records = await tx.store.getAll();
  for (const record of records) {
    if (record.synced) await tx.store.delete(record.id);
  }
  await tx.done;
}

export async function cacheSermon(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  await db.put("cached_sermons", {
    id,
    data,
    cached_at: new Date().toISOString(),
  });
}

export async function getCachedSermon(
  id: string
): Promise<Record<string, unknown> | null> {
  const db = await getDb();
  const record = await db.get("cached_sermons", id);
  return record?.data ?? null;
}
