"use client";

// Dialog que mostra todos os metadados do manuscrito em formato dt/dd.
// Aberto pelo SermonActionsMenu ("Metadados"). Substitui a coluna lateral.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { MockSermon } from "@/lib/mocks/sermons";
import { VOX_FRAMEWORKS } from "@/lib/mocks/frameworks";

interface MetadataDialogProps {
  sermon: MockSermon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_LABEL: Record<MockSermon["type"], string> = {
  "esboço": "Esboço",
  "apresentação": "Apresentação",
};

const CONTENT_TYPE_LABEL: Record<MockSermon["content_type"], string> = {
  "sermão": "Sermão",
  palestra: "Palestra",
  aula: "Aula",
};

const STATUS_LABEL: Record<MockSermon["status"], string> = {
  rascunho: "Em rascunho",
  pronto: "Pregado",
};

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return ",";
  try {
    const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
    if (Number.isNaN(d.getTime())) return ",";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return ",";
  }
}

export function MetadataDialog({
  sermon,
  open,
  onOpenChange,
}: MetadataDialogProps) {
  const framework = VOX_FRAMEWORKS.find((f) => f.id === sermon.framework);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Metadados</DialogTitle>
          <DialogDescription>
            Informações estruturais deste manuscrito.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm pt-2">
          <Row label="Tipo">{CONTENT_TYPE_LABEL[sermon.content_type]}</Row>
          <Row label="Formato">{TYPE_LABEL[sermon.type]}</Row>
          <Row label="Status">{STATUS_LABEL[sermon.status]}</Row>
          <Row label="Framework">
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: `var(--vox-fw-${sermon.framework})` }}
              />
              {framework?.name ?? sermon.framework}
            </span>
          </Row>
          <Row label="Referência">
            {sermon.bible_ref ? (
              <span className="vox-ref">{sermon.bible_ref}</span>
            ) : (
              ","
            )}
          </Row>
          {sermon.bible_book ? <Row label="Livro">{sermon.bible_book}</Row> : null}
          {sermon.series ? <Row label="Série">{sermon.series.title}</Row> : null}
          <Row label="Pregado em">{formatDate(sermon.preached_at)}</Row>
          <Row label="Palavras">
            {sermon.word_count.toLocaleString("pt-BR")}
          </Row>
          {sermon.tags.length > 0 ? (
            <Row label="Tags" stacked>
              <div className="flex flex-wrap gap-1.5">
                {sermon.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Row>
          ) : null}
          <Row label="Criado em">{formatDate(sermon.created_at, true)}</Row>
          <Row label="Atualizado">{formatDate(sermon.updated_at, true)}</Row>
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  stacked,
  children,
}: {
  label: string;
  stacked?: boolean;
  children: React.ReactNode;
}) {
  if (stacked) {
    return (
      <div>
        <dt className="text-xs vox-mono text-vox-muted mb-1.5">{label}</dt>
        <dd>{children}</dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
      <dt className="text-xs vox-mono text-vox-muted shrink-0">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
