// Lista de sermões/palestras/aulas de um usuário, visualização admin.

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminUserSermon } from "@/lib/admin/queries";

const FRAMEWORK_LABEL: Record<string, string> = {
  expositivo: "Expositivo",
  textual: "Textual",
  narrativo: "Narrativo",
  tematico: "Temático",
  topico: "Tópico",
  livre: "Livre",
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  sermão: "Sermão",
  palestra: "Palestra",
  aula: "Aula",
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  pronto: "Pronto",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AdminUserSermonsList({
  sermons,
}: {
  sermons: AdminUserSermon[];
}) {
  if (sermons.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "var(--vox-whisper-strong)" }}
      >
        <p className="vox-body text-sm text-vox-muted">
          Esse usuário ainda não criou nenhum sermão.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-card overflow-x-auto"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      <table className="w-full text-sm min-w-[760px]">
        <thead
          className="text-xs text-vox-muted vox-mono uppercase"
          style={{ borderBottom: "1px solid var(--vox-whisper)" }}
        >
          <tr>
            <th className="text-left px-5 py-3">Título</th>
            <th className="text-left px-5 py-3">Tipo</th>
            <th className="text-left px-5 py-3">Framework</th>
            <th className="text-left px-5 py-3">Referência</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-right px-5 py-3">Palavras</th>
            <th className="text-left px-5 py-3">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {sermons.map((s) => (
            <tr
              key={s.id}
              className="hover:bg-accent/30 transition-colors"
              style={{ borderBottom: "1px solid var(--vox-whisper)" }}
            >
              <td className="px-5 py-3 font-medium">
                <Link
                  href={`/sermons/${s.id}`}
                  className="hover:underline underline-offset-4"
                  style={{ color: "var(--vox-forest)" }}
                >
                  {s.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-vox-prose">
                {s.content_type
                  ? CONTENT_TYPE_LABEL[s.content_type] ?? s.content_type
                  : "—"}
              </td>
              <td className="px-5 py-3 text-vox-prose">
                {FRAMEWORK_LABEL[s.framework] ?? s.framework}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-prose">
                {s.bible_ref ?? "—"}
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor:
                      s.status === "pronto"
                        ? "var(--vox-forest)"
                        : "var(--vox-prose)",
                    color:
                      s.status === "pronto"
                        ? "var(--vox-forest)"
                        : "var(--vox-prose)",
                  }}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-right text-vox-muted">
                {s.word_count.toLocaleString("pt-BR")}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-muted">
                {formatDate(s.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
