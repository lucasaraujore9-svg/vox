// Issue 012, Configuração de Cores dos Blocos UI proto.
// Behavior real (Context + persistência) em 044.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VOX_BLOCK_TYPES, type BlockTypeId } from "@/lib/mocks/blocks";

const DEFAULT_COLORS: Record<BlockTypeId, string> = VOX_BLOCK_TYPES.reduce(
  (acc, b) => {
    // Preserve CSS variable strings literally; user can copy a hex if quiser
    acc[b.id] = b.color;
    return acc;
  },
  {} as Record<BlockTypeId, string>
);

export default function BlockColorsPage() {
  const [colors, setColors] = useState<Record<BlockTypeId, string>>(DEFAULT_COLORS);
  const dirty = useMemo(
    () =>
      VOX_BLOCK_TYPES.some((b) => colors[b.id] !== DEFAULT_COLORS[b.id]),
    [colors]
  );

  function reset() {
    setColors({ ...DEFAULT_COLORS });
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <p className="vox-eyebrow">
          <Link href="/settings" className="hover:underline">Configurações</Link>{" "}
          · Blocos
        </p>
        <h1 className="vox-h1 mt-3">Cores dos blocos</h1>
        <p className="vox-body mt-3">
          Personalize a cor de cada tipo de bloco no editor. Os blocos invisíveis no Modo
          Apresentação aparecem em cinza neutro.
        </p>
      </header>

      <section className="space-y-3">
        {VOX_BLOCK_TYPES.map((block) => (
          <Card key={block.id}>
            <CardContent className="flex items-center gap-5 py-5">
              <div
                className="size-10 rounded-md shrink-0 border border-border"
                style={{ background: colors[block.id] }}
                aria-label={`Cor de ${block.label}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{block.label}</p>
                  {!block.visibleInPresentation ? (
                    <span className="text-xs text-vox-muted italic">
                      (não aparece em apresentação)
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-vox-muted mt-1 truncate">{block.hint}</p>
              </div>
              <Input
                value={colors[block.id]}
                onChange={(e) =>
                  setColors((prev) => ({ ...prev, [block.id]: e.target.value }))
                }
                className="w-44 font-mono text-xs"
              />
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="flex items-center justify-between">
        <Button variant="ghost" onClick={reset} disabled={!dirty}>
          Restaurar padrão
        </Button>
        <Button type="submit" disabled={!dirty}>
          Salvar preferências
        </Button>
      </footer>
    </div>
  );
}
