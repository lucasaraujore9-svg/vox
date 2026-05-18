"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateAISettingsAction,
  updatePlanAction,
} from "@/lib/profile/actions";

type Plan = "manuscrito" | "concilio";

export function SettingsAIForm({
  initialEnabled,
  initialPlan,
}: {
  initialEnabled: boolean;
  initialPlan: Plan;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function onToggleAI(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await updateAISettingsAction({ ai_enabled: next });
      if (result.ok) {
        toast.success(next ? "Assistente ativado" : "Assistente desligado");
      } else {
        setEnabled(previous);
        toast.error(result.error ?? "Não foi possível salvar");
      }
    });
  }

  function switchPlan(next: Plan) {
    if (next === plan) return;
    const previous = plan;
    setPlan(next);
    if (next === "manuscrito") setEnabled(false);
    startTransition(async () => {
      const result = await updatePlanAction({ plan: next });
      if (result.ok) {
        toast.success(
          next === "concilio"
            ? "Plano Concílio ativado"
            : "Plano Manuscrito ativado"
        );
        router.refresh();
      } else {
        setPlan(previous);
        toast.error(result.error ?? "Não foi possível trocar de plano");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Seu plano</CardTitle>
          <CardDescription>
            Escolha como você quer usar o VOX. Pode trocar a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PlanCard
            id="manuscrito"
            title="Manuscrito"
            tagline="Sem IA"
            description="Editor, modelos, bíblia integrada e três modos de apresentação. Foco no essencial, sem assistente."
            active={plan === "manuscrito"}
            disabled={pending}
            onClick={() => switchPlan("manuscrito")}
          />
          <PlanCard
            id="concilio"
            title="Concílio"
            tagline="Com IA"
            description="Tudo do Manuscrito mais o assistente de exegese — análise estruturada de cada texto bíblico que você prega, na barra lateral do editor."
            active={plan === "concilio"}
            disabled={pending}
            onClick={() => switchPlan("concilio")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistente de IA</CardTitle>
          <CardDescription>
            Disponível no plano Concílio. Sugestão de estrutura, ilustrações
            e exegese de textos bíblicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <Label
                htmlFor="ai-toggle"
                className="font-medium cursor-pointer"
              >
                Ativar assistente
              </Label>
              <p className="text-sm text-vox-prose mt-1">
                {plan === "concilio"
                  ? "Quando ativo, o botão de exegese aparece no editor. Desligue a qualquer momento."
                  : "Mude para o plano Concílio para usar o assistente."}
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={enabled}
              onCheckedChange={onToggleAI}
              disabled={pending || plan !== "concilio"}
            />
          </div>
          <div
            className="rounded-lg border p-4 text-sm text-vox-prose"
            style={{
              background: "var(--vox-surface-deep)",
              borderColor: "var(--vox-whisper)",
            }}
          >
            <p className="font-medium text-vox-ink mb-1">
              Política de privacidade
            </p>
            <p>
              O conteúdo enviado para a IA é descartado depois da resposta.
              Nenhum manuscrito é armazenado ou usado para treinar modelos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanCard({
  title,
  tagline,
  description,
  active,
  disabled,
  onClick,
}: {
  id: string;
  title: string;
  tagline: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left rounded-xl p-5 transition-colors disabled:opacity-60"
      style={{
        background: active ? "var(--vox-forest-soft)" : "var(--vox-surface)",
        border: active
          ? "1px solid var(--vox-forest)"
          : "1px solid var(--vox-whisper)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3
          className="vox-h3 text-lg"
          style={{ color: active ? "var(--vox-forest)" : "var(--vox-ink)" }}
        >
          {title}
        </h3>
        <p
          className="vox-mono text-[10px] uppercase tracking-wider"
          style={{
            color: active ? "var(--vox-forest)" : "var(--vox-muted)",
          }}
        >
          {active ? "Ativo · " : ""}
          {tagline}
        </p>
      </div>
      <p className="vox-body mt-2 text-sm text-vox-prose">{description}</p>
    </button>
  );
}
