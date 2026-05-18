"use client";

import { useEffect, useState } from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { cn } from "@/lib/utils";

export function OfflineBadge({ className }: { className?: string }) {
  const { isOnline, isSyncing } = useOfflineSync();
  // Evita mismatch SSR/CSR, só renderiza após montar no client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (isOnline && !isSyncing) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs vox-mono",
        className
      )}
      style={{
        background: isOnline ? "var(--vox-forest-soft)" : "rgba(225,29,72,0.10)",
        color: isOnline ? "var(--vox-forest)" : "var(--vox-destructive)",
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block size-1.5 rounded-full animate-pulse"
        style={{
          background: isOnline ? "var(--vox-forest)" : "var(--vox-destructive)",
        }}
      />
      {isSyncing ? "Sincronizando" : isOnline ? "Online" : "Offline · salvando local"}
    </span>
  );
}
