"use client";

// Lista cards de interesses. Cada card tem ações:
//  - Converter em usuário (abre CreateUserDialog com prefill)
//  - Rejeitar
//  - Marcar como spam
//  - Notas (futuro)

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { updateInterestStatusAction } from "@/lib/interests/actions";
import type { AdminInterest } from "@/lib/admin/queries";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  invited: "Convidado",
  rejected: "Rejeitado",
  spam: "Spam",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "var(--vox-gold)",
  invited: "var(--vox-forest)",
  rejected: "var(--vox-prose)",
  spam: "var(--vox-destructive)",
};

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 60) return `há ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const d = Math.round(hr / 24);
  if (d < 30) return `há ${d} d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// Sanitiza o telefone pro link wa.me: só dígitos, com 55 (Brasil)
// quando o usuário deixou só DDD + número (10–11 dígitos).
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export function AdminInterestsList({
  interests,
}: {
  interests: AdminInterest[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [convertFor, setConvertFor] = useState<AdminInterest | null>(null);

  function updateStatus(id: string, status: "pending" | "rejected" | "spam") {
    startTransition(async () => {
      const result = await updateInterestStatusAction(id, status);
      if (result.ok) {
        toast.success("Status atualizado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro");
      }
    });
  }

  if (interests.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "var(--vox-whisper-strong)" }}
      >
        <p className="vox-body text-sm">Nada por aqui ainda.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {interests.map((it) => (
          <li
            key={it.id}
            className="rounded-xl bg-card p-5"
            style={{ border: "1px solid var(--vox-whisper)" }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="font-medium">{it.name ?? "Sem nome"}</p>
                  <Badge
                    variant="outline"
                    className="text-xs font-normal"
                    style={{
                      borderColor: STATUS_COLOR[it.status],
                      color: STATUS_COLOR[it.status],
                    }}
                  >
                    {STATUS_LABEL[it.status] ?? it.status}
                  </Badge>
                  <span className="vox-mono text-xs text-vox-muted">
                    {formatRelative(it.created_at)}
                  </span>
                </div>
                <p className="vox-mono text-xs text-vox-prose">{it.email}</p>
                {it.phone ? (
                  <p className="vox-mono text-xs mt-1">
                    <a
                      href={whatsappLink(it.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline underline-offset-4"
                      style={{ color: "var(--vox-forest)" }}
                      title="Abrir conversa no WhatsApp"
                    >
                      <svg
                        aria-hidden
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {it.phone}
                    </a>
                  </p>
                ) : null}
                {it.denomination ? (
                  <p className="text-xs text-vox-muted mt-1">{it.denomination}</p>
                ) : null}
                {it.message ? (
                  <p className="vox-body text-sm mt-3 italic text-vox-prose">
                    &ldquo;{it.message}&rdquo;
                  </p>
                ) : null}
                {it.invited_at ? (
                  <p className="vox-mono text-xs text-vox-muted mt-2">
                    Convidado em {new Date(it.invited_at).toLocaleDateString("pt-BR")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {it.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setConvertFor(it)}
                      disabled={pending}
                    >
                      Converter em usuário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(it.id, "rejected")}
                      disabled={pending}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateStatus(it.id, "spam")}
                      disabled={pending}
                      className="text-xs text-vox-muted hover:text-vox-destructive"
                    >
                      Marcar como spam
                    </Button>
                  </>
                ) : it.status !== "invited" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateStatus(it.id, "pending")}
                    disabled={pending}
                    className="text-xs"
                  >
                    Voltar para pendentes
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Dialog de conversão (controlado externamente) */}
      <CreateUserDialog
        open={Boolean(convertFor)}
        onOpenChange={(o) => !o && setConvertFor(null)}
        prefill={
          convertFor
            ? {
                email: convertFor.email,
                name: convertFor.name ?? undefined,
                denomination: convertFor.denomination ?? undefined,
                interestId: convertFor.id,
              }
            : undefined
        }
        trigger={<span hidden />}
      />
    </>
  );
}
