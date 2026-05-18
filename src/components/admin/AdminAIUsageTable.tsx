"use client";

// Tabela de uso de IA por usuário. Server Component passa o report via props.
// Permite filtrar período no client via search params.

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AIUsageReport, AIUsagePeriod } from "@/lib/admin/ai-types";

const PERIOD_LABEL: Record<AIUsagePeriod, string> = {
  "30d": "Últimos 30 dias",
  month: "Mês atual",
  all: "Todo o histórico",
};

function formatUsd(n: number): string {
  return `US$ ${n.toFixed(2)}`;
}
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 60) return `há ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const d = Math.round(hr / 24);
  if (d < 30) return `há ${d} d`;
  return date.toLocaleDateString("pt-BR");
}

export function AdminAIUsageTable({
  report,
  period,
}: {
  report: AIUsageReport;
  period: AIUsagePeriod;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function changePeriod(next: AIUsagePeriod) {
    const params = new URLSearchParams(searchParams);
    params.set("period", next);
    startTransition(() => router.push(`/admin/ai?${params.toString()}`));
  }

  return (
    <div className="space-y-8">
      <div
        className="inline-flex rounded-md border p-0.5"
        style={{ borderColor: "var(--vox-whisper)" }}
      >
        {(Object.keys(PERIOD_LABEL) as AIUsagePeriod[]).map((p) => {
          const active = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => changePeriod(p)}
              disabled={pending}
              className="vox-mono text-xs px-3 py-1.5 rounded-sm transition-colors"
              style={{
                background: active ? "var(--vox-forest)" : "transparent",
                color: active ? "#fff" : "var(--vox-prose)",
              }}
            >
              {PERIOD_LABEL[p]}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Exegeses geradas" value={String(report.total_exegeses)} />
        <Stat
          label="Tokens entrada"
          value={formatTokens(report.total_tokens_in)}
        />
        <Stat
          label="Tokens saída"
          value={formatTokens(report.total_tokens_out)}
        />
        <Stat
          label="Custo total"
          value={formatUsd(report.total_cost_usd)}
          accent
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por modelo</CardTitle>
          <CardDescription>
            Quanto cada modelo consumiu no período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.by_model.length === 0 ? (
            <p className="text-sm text-vox-muted">Sem chamadas no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider text-vox-muted"
                  style={{ borderBottom: "1px solid var(--vox-whisper)" }}
                >
                  <th className="text-left py-2 font-medium">Modelo</th>
                  <th className="text-right py-2 font-medium">Chamadas</th>
                  <th className="text-right py-2 font-medium">Custo</th>
                </tr>
              </thead>
              <tbody>
                {report.by_model.map((m) => (
                  <tr
                    key={m.model}
                    style={{ borderBottom: "1px solid var(--vox-whisper)" }}
                  >
                    <td className="py-2 vox-mono">{m.model}</td>
                    <td className="py-2 text-right vox-mono">{m.count}</td>
                    <td className="py-2 text-right vox-mono">
                      {formatUsd(m.cost_usd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por usuário</CardTitle>
          <CardDescription>
            Ranqueado por custo no período. Maior gasto no topo.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {report.by_user.length === 0 ? (
            <p className="text-sm text-vox-muted">Sem chamadas no período.</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr
                  className="text-xs uppercase tracking-wider text-vox-muted"
                  style={{ borderBottom: "1px solid var(--vox-whisper)" }}
                >
                  <th className="text-left py-2 font-medium">Usuário</th>
                  <th className="text-right py-2 font-medium">Exegeses</th>
                  <th className="text-right py-2 font-medium">Tokens (in/out)</th>
                  <th className="text-right py-2 font-medium">Custo</th>
                  <th className="text-right py-2 font-medium">Último uso</th>
                </tr>
              </thead>
              <tbody>
                {report.by_user.map((u) => (
                  <tr
                    key={u.user_id}
                    style={{ borderBottom: "1px solid var(--vox-whisper)" }}
                  >
                    <td className="py-3">
                      <p className="font-medium">{u.name ?? "Sem nome"}</p>
                      {u.email ? (
                        <p className="vox-mono text-xs text-vox-muted">
                          {u.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-right vox-mono">
                      {u.exegeses_count}
                    </td>
                    <td className="py-3 text-right vox-mono text-xs">
                      {formatTokens(u.tokens_in)} /{" "}
                      {formatTokens(u.tokens_out)}
                    </td>
                    <td
                      className="py-3 text-right vox-mono"
                      style={{ color: "var(--vox-forest)" }}
                    >
                      {formatUsd(u.cost_usd)}
                    </td>
                    <td className="py-3 text-right vox-mono text-xs text-vox-muted">
                      {formatRelative(u.last_used_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: accent ? "var(--vox-forest-soft)" : "var(--vox-surface)",
        border: accent
          ? "1px solid var(--vox-forest-tint)"
          : "1px solid var(--vox-whisper)",
      }}
    >
      <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
        {label}
      </p>
      <p
        className="mt-2 font-display text-2xl"
        style={{
          fontFamily: "var(--vox-font-display)",
          color: accent ? "var(--vox-forest)" : "var(--vox-ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </p>
    </div>
  );
}
