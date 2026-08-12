"use client";

// Seção embaixo do editor: lista de entregas + dialog pra registrar nova.
// Cada engagement tem data, local, audiência, rating (1–5 estrelas), feedback.
// A linguagem muda com o content_type: pregação, palestra ou aula.

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteEngagement, upsertEngagement } from "@/lib/sermons/engagements";
import { termsFor } from "@/lib/sermons/terminology";
import type { MockEngagement } from "@/lib/mocks/engagements";
import type { ContentType } from "@/types/database";
import { cn } from "@/lib/utils";

interface EngagementsSectionProps {
  sermonId: string;
  /** Define o vocabulário da seção: pregação, palestra ou aula. */
  contentType?: ContentType;
  /** Carregados do server (mocks ou Supabase). */
  initialEngagements: MockEngagement[];
}

export function EngagementsSection({
  sermonId,
  contentType = "sermão",
  initialEngagements,
}: EngagementsSectionProps) {
  const terms = termsFor(contentType);
  const [engagements, setEngagements] = useState<MockEngagement[]>(initialEngagements);
  const [editing, setEditing] = useState<MockEngagement | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(e: MockEngagement) {
    setEditing(e);
    setOpen(true);
  }

  function handleSaved(saved: MockEngagement) {
    setEngagements((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const copy = [...prev];
      copy[idx] = saved;
      return copy;
    });
  }

  async function handleConfirmDelete() {
    if (!deletingId || deleteBusy) return;
    setDeleteBusy(true);
    const res = await deleteEngagement(deletingId, sermonId);
    setDeleteBusy(false);
    if (!res.ok) {
      toast.error("Falha ao apagar", { description: res.error });
      return;
    }
    setEngagements((prev) => prev.filter((p) => p.id !== deletingId));
    toast.success("Registro apagado");
    setDeletingId(null);
  }

  const deletingEngagement =
    engagements.find((e) => e.id === deletingId) ?? null;

  return (
    <section className="mt-10 pt-10 border-t border-border">
      <header className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="vox-eyebrow">Histórico</p>
          <h2 className="vox-h2 mt-2">{terms.eventPlural}</h2>
          <p className="vox-body text-sm mt-2 max-w-lg">{terms.historyIntro}</p>
        </div>
        <Button onClick={openCreate}>+ {terms.registerAction}</Button>
      </header>

      {engagements.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed p-10 text-center"
          style={{ borderColor: "var(--vox-whisper-strong)" }}
        >
          <p className="vox-body text-sm">{terms.historyEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {engagements.map((e) => (
            <EngagementCard
              key={e.id}
              engagement={e}
              onEdit={() => openEdit(e)}
              onDelete={() => setDeletingId(e.id)}
            />
          ))}
        </ul>
      )}

      <EngagementDialog
        open={open}
        onOpenChange={setOpen}
        sermonId={sermonId}
        contentType={contentType}
        editing={editing}
        onSaved={handleSaved}
      />

      <Dialog
        open={deletingId !== null}
        onOpenChange={(o) => !o && !deleteBusy && setDeletingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar este registro?</DialogTitle>
            <DialogDescription>
              {deletingEngagement?.location
                ? `${terms.event} em ${deletingEngagement.location} (${new Date(
                  deletingEngagement.preached_at + "T12:00:00"
                ).toLocaleDateString("pt-BR")}).`
                : "Esse registro será removido permanentemente."}{" "}
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeletingId(null)}
              disabled={deleteBusy}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleConfirmDelete()}
              disabled={deleteBusy}
              style={{ background: "var(--vox-destructive, #B91C1C)", color: "#fff" }}
            >
              {deleteBusy ? "Apagando…" : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EngagementCard({
  engagement,
  onEdit,
  onDelete,
}: {
  engagement: MockEngagement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className="relative rounded-xl bg-card p-6"
      style={{
        border: "1px solid var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <span
        className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
        style={{ background: "var(--vox-forest)" }}
        aria-hidden
      />
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="vox-mono text-xs text-vox-muted">
            {new Date(engagement.preached_at + "T12:00:00").toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "long", year: "numeric" }
            )}
          </p>
          {engagement.location ? (
            <p className="vox-h3 mt-1.5 text-base">{engagement.location}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {engagement.rating ? <StarRating rating={engagement.rating} /> : null}
          {engagement.audience_size ? (
            <span className="vox-mono text-xs text-vox-muted">
              {engagement.audience_size.toLocaleString("pt-BR")} pessoas
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs">
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-xs text-vox-muted hover:text-vox-destructive"
            aria-label="Apagar registro"
            title="Apagar registro"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </header>
      {engagement.feedback ? (
        <p className="vox-body text-sm mt-4 italic">
          &ldquo;{engagement.feedback}&rdquo;
        </p>
      ) : null}
    </li>
  );
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          aria-label={`${n} de 5`}
          className={cn(
            "text-base leading-none",
            onChange ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            color: n <= rating ? "var(--vox-gold)" : "var(--vox-whisper-strong)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function EngagementDialog({
  open,
  onOpenChange,
  sermonId,
  contentType,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sermonId: string;
  contentType: ContentType;
  editing: MockEngagement | null;
  onSaved: (e: MockEngagement) => void;
}) {
  const terms = termsFor(contentType);
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(
    editing?.preached_at ?? new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState(editing?.location ?? "");
  const [audience, setAudience] = useState(
    editing?.audience_size?.toString() ?? ""
  );
  const [rating, setRating] = useState(editing?.rating ?? 0);
  const [feedback, setFeedback] = useState(editing?.feedback ?? "");
  const [error, setError] = useState<string | null>(null);

  // Reset quando muda o engagement editado
  function syncOpen(next: boolean) {
    if (next) {
      setDate(editing?.preached_at ?? new Date().toISOString().slice(0, 10));
      setLocation(editing?.location ?? "");
      setAudience(editing?.audience_size?.toString() ?? "");
      setRating(editing?.rating ?? 0);
      setFeedback(editing?.feedback ?? "");
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await upsertEngagement({
        id: editing?.id,
        sermonId,
        preachedAt: date,
        location: location.trim() || undefined,
        audienceSize: audience ? parseInt(audience, 10) : undefined,
        rating: rating || undefined,
        feedback: feedback.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Sucesso real (com Supabase), atualiza lista local com o id retornado
      onSaved({
        id: result.id,
        preached_at: date,
        location: location.trim() || null,
        audience_size: audience ? parseInt(audience, 10) : null,
        rating: rating || null,
        feedback: feedback.trim() || null,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={syncOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? terms.editAction : terms.registerAction}
          </DialogTitle>
          <DialogDescription>
            Anote como foi. O que funcionou, o que falhou, e onde aconteceu.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">
              Audiência{" "}
              <span className="text-vox-muted text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="audience"
              type="number"
              min="0"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Quantas pessoas"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Igreja, evento, célula..."
          />
        </div>

        <div className="space-y-2">
          <Label>
            Como foi?{" "}
            <span className="text-vox-muted text-xs font-normal">(1–5)</span>
          </Label>
          <StarRating rating={rating} onChange={setRating} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback / o que aprendi</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
            placeholder="O que foi forte, o que ficou fraco, o que faria diferente..."
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Salvando…" : editing ? "Salvar alterações" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
