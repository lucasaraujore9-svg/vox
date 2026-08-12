// Card de conteúdo (sermão, palestra ou aula) usado no banco e no dashboard.
// Issue 001 / 003.

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MockSermon } from "@/lib/mocks/sermons";
import { statusLabelFor, termsFor } from "@/lib/sermons/terminology";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function ContentCard({
  sermon,
  archived = false,
  className,
}: {
  sermon: MockSermon;
  archived?: boolean;
  className?: string;
}) {
  const accent = `var(--vox-fw-${sermon.framework})`;
  return (
    <Link
      href={`/sermons/${sermon.id}`}
      className={cn(
        "group block relative rounded-xl p-6 bg-card transition-all",
        "border hover:shadow-[var(--vox-shadow-card-hover)]",
        archived && "opacity-75",
        className
      )}
      style={{
        borderColor: "var(--vox-whisper)",
        boxShadow: "var(--vox-shadow-card)",
      }}
    >
      <span
        className="absolute left-0 top-6 bottom-6 w-1 rounded-r"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full" style={{ background: accent }} />
          <span className="vox-eyebrow" style={{ color: accent }}>
            {termsFor(sermon.content_type).label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {archived ? (
            <Badge
              variant="outline"
              className="text-xs font-normal"
              style={{
                borderColor: "var(--vox-gold)",
                color: "var(--vox-gold)",
              }}
            >
              Arquivado
            </Badge>
          ) : null}
          <Badge variant="secondary" className="text-xs font-normal">
            {statusLabelFor(sermon.content_type, sermon.status)}
          </Badge>
        </div>
      </div>

      <h3 className="vox-h3 mt-3 text-lg group-hover:text-vox-forest transition-colors">
        {sermon.title}
      </h3>

      <p className="vox-ref mt-2">{sermon.bible_ref}</p>

      <p className="vox-body mt-3 text-sm line-clamp-2">{sermon.preview}</p>

      <div className="mt-5 flex items-center justify-between text-xs vox-mono text-vox-muted">
        <span>
          {sermon.word_count.toLocaleString("pt-BR")} palavras
        </span>
        <span>{formatRelative(sermon.updated_at)}</span>
      </div>

      {sermon.series ? (
        <p className="mt-2 text-xs text-vox-muted truncate">
          Série: {sermon.series.title}
        </p>
      ) : null}
    </Link>
  );
}
