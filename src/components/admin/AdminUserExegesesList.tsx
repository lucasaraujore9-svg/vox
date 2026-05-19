// Lista de exegeses solicitadas por um usuário (catálogo global, mas
// vinculadas ao usuário via sermon_exegeses).

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AdminUserExegesis } from "@/lib/admin/queries";

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

export function AdminUserExegesesList({
  exegeses,
}: {
  exegeses: AdminUserExegesis[];
}) {
  if (exegeses.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "var(--vox-whisper-strong)" }}
      >
        <p className="vox-body text-sm text-vox-muted">
          Esse usuário ainda não solicitou nenhuma exegese.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-card overflow-x-auto"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      <table className="w-full text-sm min-w-[820px]">
        <thead
          className="text-xs text-vox-muted vox-mono uppercase"
          style={{ borderBottom: "1px solid var(--vox-whisper)" }}
        >
          <tr>
            <th className="text-left px-5 py-3">Passagem</th>
            <th className="text-left px-5 py-3">Versão</th>
            <th className="text-left px-5 py-3">Sermão</th>
            <th className="text-left px-5 py-3">Modelo</th>
            <th className="text-right px-5 py-3">Tokens (in / out)</th>
            <th className="text-right px-5 py-3">Custo USD</th>
            <th className="text-left px-5 py-3">Solicitado em</th>
          </tr>
        </thead>
        <tbody>
          {exegeses.map((e) => (
            <tr
              key={`${e.sermon_id}-${e.id}`}
              className="hover:bg-accent/30 transition-colors"
              style={{ borderBottom: "1px solid var(--vox-whisper)" }}
            >
              <td className="px-5 py-3 font-medium">
                {e.book_name} {e.chapter}
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal vox-mono"
                  style={{
                    borderColor: "var(--vox-gold)",
                    color: "var(--vox-gold)",
                  }}
                >
                  {e.version}
                </Badge>
              </td>
              <td className="px-5 py-3 text-vox-prose">
                {e.sermon_id ? (
                  <Link
                    href={`/sermons/${e.sermon_id}`}
                    className="hover:underline underline-offset-4"
                    style={{ color: "var(--vox-forest)" }}
                  >
                    {e.sermon_title ?? "Sem título"}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-prose">
                {e.model}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-right text-vox-muted">
                {e.tokens_in.toLocaleString("pt-BR")} ·{" "}
                {e.tokens_out.toLocaleString("pt-BR")}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-right">
                ${e.cost_usd.toFixed(4)}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-muted">
                {formatDate(e.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
