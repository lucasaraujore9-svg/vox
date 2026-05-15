"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { syncPendingSermons, type SyncResult } from "@/lib/offline/sync";

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: SyncResult | null;
}

export function useOfflineSync() {
  const [state, setState] = useState<OfflineSyncState>(() => ({
    isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
    isSyncing: false,
    lastSync: null,
  }));
  const inflight = useRef(false);

  const runSync = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setState((s) => ({ ...s, isSyncing: true }));
    try {
      const result = await syncPendingSermons();
      setState((s) => ({ ...s, lastSync: result }));
    } finally {
      inflight.current = false;
      setState((s) => ({ ...s, isSyncing: false }));
    }
  }, []);

  useEffect(() => {
    function handleOnline() {
      setState((s) => ({ ...s, isOnline: true }));
      void runSync();
    }
    function handleOffline() {
      setState((s) => ({ ...s, isOnline: false }));
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Tentativa inicial de sync se online ao montar
    if (navigator.onLine) void runSync();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [runSync]);

  return state;
}
