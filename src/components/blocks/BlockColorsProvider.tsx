// Issue 044, Context que aplica as cores escolhidas como CSS custom properties no <html>.
// Renderiza nada visualmente; só injeta um <style> com :root overrides.

"use client";

import { createContext, useContext, useMemo } from "react";
import type { BlockTypeId } from "@/lib/mocks/blocks";
import { VOX_BLOCK_TYPES } from "@/lib/mocks/blocks";

export type BlockColorMap = Record<BlockTypeId, string>;

const BlockColorsContext = createContext<BlockColorMap | null>(null);

export function useBlockColor(id: BlockTypeId): string {
  const ctx = useContext(BlockColorsContext);
  if (ctx && ctx[id]) return ctx[id];
  return VOX_BLOCK_TYPES.find((b) => b.id === id)?.color ?? "var(--vox-prose)";
}

export function BlockColorsProvider({
  value,
  children,
}: {
  value: BlockColorMap;
  children: React.ReactNode;
}) {
  const css = useMemo(() => {
    const lines = Object.entries(value)
      .map(([id, color]) => `  --vox-block-${id.replace(/_/g, "-")}: ${color};`)
      .join("\n");
    return `:root {\n${lines}\n}`;
  }, [value]);

  return (
    <BlockColorsContext.Provider value={value}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </BlockColorsContext.Provider>
  );
}
