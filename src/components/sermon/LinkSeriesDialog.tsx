"use client";

// Dialog "Vincular a série" — disponível no SermonActionsMenu e também
// para qualquer ação que precise mudar a série de um manuscrito.
// Suporta: escolher série existente (com indentação por subpasta), criar
// série nova (opcionalmente dentro de uma pasta) ou desvincular.

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkSermonToSeriesAction, upsertSeriesAction } from "@/lib/series/actions";
import { buildSeriesTree, flattenTree, type SeriesFlat } from "@/lib/series/tree";
import { cn } from "@/lib/utils";

interface LinkSeriesDialogProps {
  sermonId: string;
  currentSeriesId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: (newSeriesId: string | null) => void;
}

export function LinkSeriesDialog({
  sermonId,
  currentSeriesId,
  open,
  onOpenChange,
  onLinked,
}: LinkSeriesDialogProps) {
  const [series, setSeries] = useState<SeriesFlat[]>([]);
  const [selected, setSelected] = useState<string | null>(currentSeriesId);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newParent, setNewParent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setSelected(currentSeriesId);
    setCreating(false);
    setNewTitle("");
    setNewParent(null);
    fetch("/api/series-and-courses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { series: [] }))
      .then((data: { series?: SeriesFlat[] }) => setSeries(data.series ?? []))
      .catch(() => setSeries([]));
  }, [open, currentSeriesId]);

  const flat = useMemo(
    () => flattenTree(buildSeriesTree(series)),
    [series]
  );

  async function handleSave() {
    setBusy(true);
    try {
      let nextId: string | null = selected;
      if (creating) {
        const title = newTitle.trim();
        if (!title) {
          toast.error("Dê um nome para a nova série");
          return;
        }
        const created = await upsertSeriesAction({
          title,
          parent_id: newParent,
        });
        if (!created.ok) {
          toast.error("Falha ao criar série", { description: created.error });
          return;
        }
        nextId = created.id;
      }
      const res = await linkSermonToSeriesAction(sermonId, nextId);
      if (!res.ok) {
        toast.error("Falha ao vincular", { description: res.error });
        return;
      }
      toast.success(nextId ? "Vinculado à série" : "Manuscrito sem série");
      onLinked?.(nextId);
      onOpenChange(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular a série</DialogTitle>
          <DialogDescription>
            Escolha uma série existente, crie uma nova ou desvincule este manuscrito.
          </DialogDescription>
        </DialogHeader>

        {!creating ? (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={cn(
                "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                selected === null
                  ? "bg-vox-forest text-white"
                  : "hover:bg-vox-whisper/40"
              )}
            >
              <span className="vox-mono text-xs opacity-70">—</span>{" "}
              Sem série (avulso)
            </button>
            {flat.length === 0 ? (
              <p className="text-sm text-vox-muted italic px-3 py-2">
                Você ainda não tem séries. Crie uma nova abaixo.
              </p>
            ) : (
              flat.map((node) => {
                const isActive = selected === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelected(node.id)}
                    className={cn(
                      "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-vox-forest text-white"
                        : "hover:bg-vox-whisper/40"
                    )}
                    style={{ paddingLeft: 12 + node.depth * 18 }}
                  >
                    <span className="vox-mono text-[10px] opacity-60 mr-1.5">
                      {"›".repeat(Math.min(node.depth, 4)) || "•"}
                    </span>
                    {node.title}
                    <span className="vox-mono text-[10px] opacity-60 ml-2">
                      ({node.sermon_count})
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-series-title">Nome da nova série</Label>
              <Input
                id="new-series-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Romanos — A Justificação pela Fé"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-series-parent">
                Dentro de qual pasta? (opcional)
              </Label>
              <select
                id="new-series-parent"
                value={newParent ?? ""}
                onChange={(e) => setNewParent(e.target.value || null)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
                style={{ borderColor: "var(--vox-whisper)" }}
              >
                <option value="">— Nível raiz —</option>
                {flat.map((node) => (
                  <option key={node.id} value={node.id}>
                    {"  ".repeat(node.depth)}
                    {node.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCreating(!creating)}
            disabled={busy}
          >
            {creating ? "← Escolher existente" : "+ Criar nova"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
