"use client";

// /sermons?view=grouped — árvore de pastas/subpastas de séries, com manuscritos
// abaixo. Ações inline: criar pasta, criar subpasta, renomear, excluir, mover.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderTree,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContentCard } from "@/components/sermon/ContentCard";
import {
  deleteSeriesAction,
  moveSeriesAction,
  upsertSeriesAction,
} from "@/lib/series/actions";
import {
  buildSeriesTree,
  flattenTree,
  descendantIds,
  type SeriesFlat,
  type SeriesNode,
} from "@/lib/series/tree";
import type { MockSermon } from "@/lib/mocks/sermons";
import { cn } from "@/lib/utils";

interface SeriesTreeViewProps {
  series: SeriesFlat[];
  sermons: MockSermon[];
}

export function SeriesTreeView({ series, sermons }: SeriesTreeViewProps) {
  const router = useRouter();
  const tree = useMemo(() => buildSeriesTree(series), [series]);
  const allFlat = useMemo(() => flattenTree(tree), [tree]);

  // Agrupa sermões por series_id, e separa avulsos
  const { bySeries, orphans } = useMemo(() => {
    const map = new Map<string, MockSermon[]>();
    const orph: MockSermon[] = [];
    for (const s of sermons) {
      if (!s.series) {
        orph.push(s);
        continue;
      }
      const arr = map.get(s.series.id);
      if (arr) arr.push(s);
      else map.set(s.series.id, [s]);
    }
    return { bySeries: map, orphans: orph };
  }, [sermons]);

  // Expansão: tudo aberto por padrão. Persistido em memória do componente.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Diálogos
  const [editing, setEditing] = useState<SeriesNode | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [creatingUnder, setCreatingUnder] = useState<{
    parent: SeriesNode | null;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [moving, setMoving] = useState<SeriesNode | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SeriesNode | null>(null);
  const [busy, setBusy] = useState(false);

  function openRename(node: SeriesNode) {
    setEditing(node);
    setEditTitle(node.title);
  }
  function openCreateRoot() {
    setCreatingUnder({ parent: null });
    setNewTitle("");
  }
  function openCreateUnder(node: SeriesNode) {
    setCreatingUnder({ parent: node });
    setNewTitle("");
  }
  function openMove(node: SeriesNode) {
    setMoving(node);
    setMoveTarget(node.parent_id);
  }

  async function handleRenameSave() {
    if (!editing || busy) return;
    const title = editTitle.trim();
    if (!title) {
      toast.error("Dê um nome à série");
      return;
    }
    setBusy(true);
    const res = await upsertSeriesAction({ id: editing.id, title });
    setBusy(false);
    if (!res.ok) {
      toast.error("Falha ao renomear", { description: res.error });
      return;
    }
    setEditing(null);
    toast.success("Série atualizada");
    router.refresh();
  }

  async function handleCreateSave() {
    if (!creatingUnder || busy) return;
    const title = newTitle.trim();
    if (!title) {
      toast.error("Dê um nome à pasta");
      return;
    }
    setBusy(true);
    const res = await upsertSeriesAction({
      title,
      parent_id: creatingUnder.parent?.id ?? null,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Falha ao criar", { description: res.error });
      return;
    }
    setCreatingUnder(null);
    toast.success("Pasta criada");
    router.refresh();
  }

  async function handleMoveSave() {
    if (!moving || busy) return;
    setBusy(true);
    const res = await moveSeriesAction({
      id: moving.id,
      parent_id: moveTarget,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Falha ao mover", { description: res.error });
      return;
    }
    setMoving(null);
    toast.success("Série movida");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete || busy) return;
    setBusy(true);
    const res = await deleteSeriesAction(confirmDelete.id);
    setBusy(false);
    if (!res.ok) {
      toast.error("Falha ao apagar", { description: res.error });
      return;
    }
    setConfirmDelete(null);
    toast.success("Série apagada");
    router.refresh();
  }

  // Para o select de "mover", excluir o próprio nó e seus descendentes.
  const moveTargets = useMemo(() => {
    if (!moving) return allFlat;
    const skip = descendantIds(moving);
    skip.add(moving.id);
    return allFlat.filter((n) => !skip.has(n.id));
  }, [allFlat, moving]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="vox-mono text-xs text-vox-muted">
          {series.length} {series.length === 1 ? "pasta" : "pastas"} ·{" "}
          {sermons.length} manuscritos
        </p>
        <Button size="sm" onClick={openCreateRoot} variant="outline">
          <FolderPlus className="size-3.5 mr-1.5" />
          Nova pasta
        </Button>
      </div>

      {tree.length === 0 && orphans.length === 0 ? (
        <p className="vox-body text-center py-12 text-vox-muted">
          Nenhuma série e nenhum manuscrito ainda.
        </p>
      ) : null}

      <div className="space-y-2">
        {tree.map((node) => (
          <SeriesBranch
            key={node.id}
            node={node}
            collapsed={collapsed}
            onToggle={toggle}
            bySeries={bySeries}
            onRename={openRename}
            onCreateUnder={openCreateUnder}
            onMove={openMove}
            onDelete={(n) => setConfirmDelete(n)}
          />
        ))}
      </div>

      {orphans.length > 0 ? (
        <section className="pt-8 mt-6 border-t border-border/40">
          <header className="flex items-end justify-between mb-4">
            <div>
              <p className="vox-eyebrow text-xs text-vox-muted">Avulsos</p>
              <h3 className="vox-h3 mt-1.5 text-base">Sem série</h3>
            </div>
            <span className="vox-mono text-xs text-vox-muted">
              {orphans.length} manuscritos
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {orphans.map((sermon) => (
              <ContentCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Diálogo: criar nova pasta */}
      <Dialog
        open={creatingUnder !== null}
        onOpenChange={(o) => !busy && !o && setCreatingUnder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {creatingUnder?.parent
                ? `Nova subpasta em "${creatingUnder.parent.title}"`
                : "Nova pasta"}
            </DialogTitle>
            <DialogDescription>
              Pastas agrupam séries de manuscritos. Você pode reorganizar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-folder">Nome</Label>
            <Input
              id="new-folder"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Romanos — A Justificação pela Fé"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreatingUnder(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleCreateSave()} disabled={busy}>
              {busy ? "Criando…" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: renomear */}
      <Dialog open={editing !== null} onOpenChange={(o) => !busy && !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear série</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-folder">Nome</Label>
            <Input
              id="edit-folder"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleRenameSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={() => void handleRenameSave()} disabled={busy}>
              {busy ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: mover */}
      <Dialog open={moving !== null} onOpenChange={(o) => !busy && !o && setMoving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover &quot;{moving?.title}&quot;</DialogTitle>
            <DialogDescription>
              Escolha a nova pasta-pai. &quot;Nível raiz&quot; deixa a série fora de qualquer pasta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="move-target">Nova pasta-pai</Label>
            <select
              id="move-target"
              value={moveTarget ?? ""}
              onChange={(e) => setMoveTarget(e.target.value || null)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
              style={{ borderColor: "var(--vox-whisper)" }}
            >
              <option value="">— Nível raiz —</option>
              {moveTargets.map((n) => (
                <option key={n.id} value={n.id}>
                  {"  ".repeat(n.depth)}
                  {n.title}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoving(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={() => void handleMoveSave()} disabled={busy}>
              {busy ? "Movendo…" : "Mover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: confirmar exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !busy && !o && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar &quot;{confirmDelete?.title}&quot;?</DialogTitle>
            <DialogDescription>
              Os manuscritos da série não são apagados — voltam para &quot;avulsos&quot;.
              Subpastas, se existirem, vão para o nível raiz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={busy}
              style={{ background: "var(--vox-destructive, #B91C1C)", color: "#fff" }}
            >
              {busy ? "Apagando…" : "Apagar série"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SeriesBranchProps {
  node: SeriesNode;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  bySeries: Map<string, MockSermon[]>;
  onRename: (n: SeriesNode) => void;
  onCreateUnder: (n: SeriesNode) => void;
  onMove: (n: SeriesNode) => void;
  onDelete: (n: SeriesNode) => void;
}

function SeriesBranch({
  node,
  collapsed,
  onToggle,
  bySeries,
  onRename,
  onCreateUnder,
  onMove,
  onDelete,
}: SeriesBranchProps) {
  const isCollapsed = collapsed.has(node.id);
  const items = bySeries.get(node.id) ?? [];
  const hasContent = items.length > 0 || node.children.length > 0;

  return (
    <section
      className="rounded-lg"
      style={{
        marginLeft: node.depth * 16,
      }}
    >
      <header
        className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-vox-whisper/30 transition-colors group"
      >
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="size-6 inline-flex items-center justify-center text-vox-muted hover:text-vox-ink rounded"
          aria-label={isCollapsed ? "Expandir" : "Recolher"}
          disabled={!hasContent}
          style={{ opacity: hasContent ? 1 : 0.3 }}
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        <FolderTree className="size-4 text-vox-forest" />
        <h3
          className="vox-h3 text-base flex-1 min-w-0 truncate"
          style={{ color: "var(--vox-ink)" }}
        >
          {node.title}
        </h3>
        <span className="vox-mono text-xs text-vox-muted">
          {items.length}
          {node.children.length > 0 ? ` · ${node.children.length} subpastas` : ""}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="size-7 inline-flex items-center justify-center rounded text-vox-muted hover:text-vox-ink opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Ações da série"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onRename(node)}>
              <Pencil className="size-3.5 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCreateUnder(node)}>
              <FolderPlus className="size-3.5 mr-2" />
              Nova subpasta
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(node)}>
              <FolderTree className="size-3.5 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(node)}
              className="text-vox-destructive focus:text-vox-destructive"
            >
              <Trash2 className="size-3.5 mr-2" />
              Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {!isCollapsed ? (
        <div
          className="pl-7 ml-2 space-y-3"
          style={{
            borderLeft: "1px dashed var(--vox-whisper-strong, var(--vox-whisper))",
            paddingBottom: 8,
          }}
        >
          {items.length > 0 ? (
            <div
              className={cn(
                "grid gap-4 pt-2",
                items.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}
            >
              {items.map((sermon) => (
                <ContentCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          ) : null}
          {node.children.map((child) => (
            <SeriesBranch
              key={child.id}
              node={child}
              collapsed={collapsed}
              onToggle={onToggle}
              bySeries={bySeries}
              onRename={onRename}
              onCreateUnder={onCreateUnder}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
