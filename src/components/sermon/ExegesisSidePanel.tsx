"use client";

// Painel lateral de exegeses no editor.
// Sheet à direita, segue o padrão de BibleSidePanel.
//
// Comportamento:
// - Trigger: botão "Exegeses (n)" na header do sermão
// - Dentro: lista de cards, cada um expansível pra ver o conteúdo completo
// - Botão "Nova exegese" abre formulário inline pra gerar via IA
// - Gate: se o usuário não está no plano Concílio, mostra upgrade prompt

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ExegesisMarkdown } from "@/components/sermon/ExegesisMarkdown";
import {
  createExegesisAction,
  deleteExegesisAction,
} from "@/lib/exegesis/actions";

type BibleVersion = "ARC" | "ARA" | "NVI" | "NAA" | "NVT";

export interface ExegesisListItem {
  id: string;
  passage: string;
  version: string;
  content: string;
  created_at: string;
  model: string;
}

interface Props {
  sermonId: string;
  defaultVersion: BibleVersion;
  initialExegeses: ExegesisListItem[];
  /** 'concilio' libera geração via IA. 'manuscrito' mostra upgrade prompt. */
  plan: "manuscrito" | "concilio";
  aiEnabled: boolean;
  defaultPassage?: string;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 60) return `há ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const d = Math.round(hr / 24);
  if (d < 30) return `há ${d} d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function ExegesisSidePanel({
  sermonId,
  defaultVersion,
  initialExegeses,
  plan,
  aiEnabled,
  defaultPassage,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(initialExegeses.length === 0);
  const [passage, setPassage] = useState(defaultPassage ?? "");
  const [version, setVersion] = useState<BibleVersion>(defaultVersion);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialExegeses[0]?.id ?? null
  );
  const [pending, startTransition] = useTransition();

  const canUse = plan === "concilio" && aiEnabled;

  function generate() {
    if (!canUse) return;
    if (passage.trim().length < 2) {
      toast.error("Informe a passagem (ex: Romanos 5:1-11)");
      return;
    }
    startTransition(async () => {
      const result = await createExegesisAction({
        passage: passage.trim(),
        version,
        sermon_id: sermonId,
      });
      if (result.ok) {
        toast.success("Exegese gerada");
        setShowForm(false);
        setPassage("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível gerar");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir esta exegese?")) return;
    startTransition(async () => {
      const result = await deleteExegesisAction(id);
      if (result.ok) {
        toast.success("Exegese removida");
        if (expandedId === id) setExpandedId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível excluir");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Exegeses ({initialExegeses.length})
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl gap-0 p-0 flex flex-col"
        style={{ background: "var(--vox-bg)" }}
      >
        <SheetHeader className="px-6 py-5 border-b" style={{ borderColor: "var(--vox-whisper)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="vox-eyebrow text-[10px]">Estudo do texto</p>
              <SheetTitle className="vox-h3 text-lg mt-1">
                Exegeses
              </SheetTitle>
            </div>
            {canUse ? (
              <Button
                size="sm"
                onClick={() => setShowForm((v) => !v)}
                disabled={pending}
              >
                {showForm ? "Cancelar" : "Nova exegese"}
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {!canUse ? (
          <UpgradePrompt plan={plan} aiEnabled={aiEnabled} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {showForm ? (
              <div
                className="px-6 py-5 border-b space-y-4"
                style={{
                  background: "var(--vox-surface-deep)",
                  borderColor: "var(--vox-whisper)",
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="exegesis-passage">Passagem</Label>
                  <Input
                    id="exegesis-passage"
                    placeholder="Ex: Romanos 5:1-11"
                    value={passage}
                    onChange={(e) => setPassage(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exegesis-version">Versão</Label>
                  <Select
                    value={version}
                    onValueChange={(v) => setVersion(v as BibleVersion)}
                    disabled={pending}
                  >
                    <SelectTrigger id="exegesis-version">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARC">ARC</SelectItem>
                      <SelectItem value="ARA">ARA</SelectItem>
                      <SelectItem value="NVI">NVI</SelectItem>
                      <SelectItem value="NAA">NAA</SelectItem>
                      <SelectItem value="NVT">NVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={generate}
                  disabled={pending || passage.trim().length < 2}
                >
                  {pending ? "Gerando…" : "Gerar exegese"}
                </Button>
                <p className="text-[11px] text-vox-muted">
                  Análise estruturada em 5 seções: contexto, gênero,
                  palavras-chave, argumento, ganchos. Leva ~15s.
                </p>
              </div>
            ) : null}

            {initialExegeses.length === 0 && !showForm ? (
              <div className="p-10 text-center">
                <p className="vox-body text-sm text-vox-muted">
                  Nenhuma exegese ainda para este sermão.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowForm(true)}
                >
                  Criar primeira
                </Button>
              </div>
            ) : null}

            <ul className="divide-y" style={{ borderColor: "var(--vox-whisper)" }}>
              {initialExegeses.map((ex) => {
                const isOpen = expandedId === ex.id;
                return (
                  <li
                    key={ex.id}
                    style={{ borderColor: "var(--vox-whisper)" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isOpen ? null : ex.id)
                      }
                      className="w-full text-left px-6 py-4 hover:bg-[var(--vox-surface-deep)] transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="vox-ref text-[14px]"
                          style={{ color: "var(--vox-gold)" }}
                        >
                          {ex.passage}
                        </p>
                        <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted mt-1">
                          {ex.version} · {formatRelative(ex.created_at)} ·{" "}
                          {ex.model}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className="vox-mono text-xl shrink-0 transition-transform"
                        style={{
                          color: "var(--vox-forest)",
                          lineHeight: 1,
                          transform: isOpen ? "rotate(45deg)" : undefined,
                        }}
                      >
                        +
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="px-6 pb-6">
                        <div
                          className="rounded-lg p-4"
                          style={{
                            background: "var(--vox-surface)",
                            border: "1px solid var(--vox-whisper)",
                          }}
                        >
                          <ExegesisMarkdown content={ex.content} />
                        </div>
                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            onClick={() => remove(ex.id)}
                            disabled={pending}
                            className="text-xs text-vox-muted hover:text-vox-destructive"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UpgradePrompt({
  plan,
  aiEnabled,
}: {
  plan: "manuscrito" | "concilio";
  aiEnabled: boolean;
}) {
  return (
    <div className="p-10 text-center space-y-4">
      <div
        className="mx-auto size-12 rounded-full flex items-center justify-center"
        style={{ background: "var(--vox-forest-soft)" }}
      >
        <span
          className="vox-mono text-lg"
          style={{ color: "var(--vox-forest)" }}
        >
          ✻
        </span>
      </div>
      {plan === "manuscrito" ? (
        <>
          <h3 className="vox-h3 text-lg">Exegese assistida é do Concílio</h3>
          <p className="vox-body text-sm text-vox-muted max-w-sm mx-auto">
            Análise estruturada de cada texto bíblico que você prega faz parte
            do plano <strong>Concílio</strong>, com assistente de IA.
          </p>
          <Button asChild size="sm">
            <Link href="/settings">Mudar plano</Link>
          </Button>
        </>
      ) : !aiEnabled ? (
        <>
          <h3 className="vox-h3 text-lg">Assistente desativado</h3>
          <p className="vox-body text-sm text-vox-muted max-w-sm mx-auto">
            Ative o assistente em configurações para gerar exegeses.
          </p>
          <Button asChild size="sm">
            <Link href="/settings">Ativar assistente</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}
