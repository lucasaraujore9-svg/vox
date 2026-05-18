"use client";

// Dialog que abre a partir do botão "Versões" no editor.
// Lista cronológica de snapshots, cada um com data + nota + word_count.
// Click "Restaurar" → confirmação inline → chamada saveAndRestore.

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  saveSermonVersion,
  restoreSermonVersion,
  listSermonVersions,
} from "@/lib/sermons/versions";
import type { MockVersion } from "@/lib/mocks/versions";

interface VersionsDialogProps {
  sermonId: string;
  /** Versões mock pra fallback quando Supabase não tá disponível */
  fallbackVersions?: MockVersion[];
  trigger?: React.ReactNode;
}

export function VersionsDialog({
  sermonId,
  fallbackVersions = [],
  trigger,
}: VersionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "save">("list");
  const [versions, setVersions] = useState<MockVersion[]>(fallbackVersions);
  const [loadingList, setLoadingList] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function refreshVersions() {
    setLoadingList(true);
    try {
      const rows = await listSermonVersions(sermonId);
      setVersions(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          word_count: r.word_count,
          note: r.note,
          created_at: r.created_at,
        }))
      );
    } catch {
      // Mantém o que estiver na tela; mostra erro suave abaixo.
      setError("Falha ao carregar histórico.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void refreshVersions();
    // refreshVersions é estável dentro deste componente (não passa em deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sermonId]);

  function handleSave() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await saveSermonVersion({ sermonId, note: note.trim() || undefined });
      if (!result.ok) {
        setError(result.error);
      } else {
        setFeedback("Versão salva.");
        setNote("");
        // Já recarrega o histórico e troca pra aba de lista pra mostrar.
        await refreshVersions();
        setTab("list");
      }
    });
  }

  function handleRestore(versionId: string) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await restoreSermonVersion(versionId);
      if (!result.ok) {
        setError(result.error ?? "Erro ao restaurar");
      } else {
        setFeedback("Versão restaurada. Recarregue a página pra ver as mudanças.");
        setConfirmingId(null);
      }
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Versões do manuscrito</DialogTitle>
            <DialogDescription>
              Cada vez que você salva uma versão, geramos um snapshot. Você pode
              restaurar qualquer versão anterior a qualquer momento, o estado atual
              vira uma versão automática antes da restauração.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border pb-3">
            <Button
              type="button"
              size="sm"
              variant={tab === "list" ? "default" : "ghost"}
              onClick={() => setTab("list")}
            >
              Histórico ({versions.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "save" ? "default" : "ghost"}
              onClick={() => setTab("save")}
            >
              + Salvar versão
            </Button>
          </div>

          {feedback ? (
            <Alert>
              <AlertDescription>{feedback}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {tab === "list" ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {loadingList ? (
                <li className="text-sm text-vox-muted italic py-6 text-center">
                  Carregando…
                </li>
              ) : versions.length === 0 ? (
                <li className="text-sm text-vox-muted italic py-6 text-center">
                  Nenhuma versão salva ainda. Clique em &ldquo;+ Salvar versão&rdquo;
                  para criar a primeira.
                </li>
              ) : (
                versions.map((v) => (
                  <li
                    key={v.id}
                    className="rounded-lg border p-4"
                    style={{ borderColor: "var(--vox-whisper)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{v.title}</p>
                        <p className="vox-mono text-xs text-vox-muted mt-1">
                          {new Date(v.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {v.word_count.toLocaleString("pt-BR")} palavras
                        </p>
                        {v.note ? (
                          <p className="text-sm text-vox-prose mt-2 italic">
                            &ldquo;{v.note}&rdquo;
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0">
                        {confirmingId === v.id ? (
                          <div className="flex gap-2 items-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingId(null)}
                              disabled={pending}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRestore(v.id)}
                              disabled={pending}
                            >
                              Confirmar restauração
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmingId(v.id)}
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version-note">
                  Nota da versão{" "}
                  <span className="text-vox-muted text-xs font-normal">(opcional)</span>
                </Label>
                <Input
                  id="version-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Adicionei aplicação final"
                />
              </div>
              <p className="text-xs text-vox-muted">
                A versão captura o estado atual do título, framework, referência bíblica e
                conteúdo. Auto-saves silenciosos não criam versão, só este botão.
              </p>
            </div>
          )}

          <DialogFooter>
            {tab === "save" ? (
              <Button onClick={handleSave} disabled={pending}>
                {pending ? "Salvando…" : "Salvar versão"}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
