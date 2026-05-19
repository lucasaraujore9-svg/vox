"use client";

// Aba "Meu plano" de /settings.
// Substitui a antiga aba "IA". Concentra:
//  - Plano atual (Manuscrito × Concílio) com troca
//  - Sub-controle do assistente (toggle ai_enabled, só visível no Concílio)
//  - Próxima cobrança (placeholder até billing integrar)
//  - Histórico de faturas (placeholder até billing integrar)

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

const PLAN_PRICE_BRL: Record<Plan, string> = {
  manuscrito: "Gratuito durante o lançamento",
  concilio: "R$ 19,90/mês",
};

export function SettingsPlanForm({
  initialPlan,
  initialEnabled,
}: {
  initialPlan: Plan;
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

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

  return (
    <div className="space-y-5">
      {/* Plano atual em destaque */}
      <Card
        style={{
          background: "var(--vox-forest-soft)",
          borderColor: "var(--vox-forest)",
        }}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p
                className="vox-eyebrow"
                style={{ color: "var(--vox-forest)" }}
              >
                Plano atual
              </p>
              <CardTitle
                className="mt-2 text-2xl"
                style={{ color: "var(--vox-forest)" }}
              >
                {plan === "concilio" ? "Concílio" : "Manuscrito"}
              </CardTitle>
              <CardDescription className="mt-2">
                {plan === "concilio"
                  ? "Editor completo + assistente de exegese assistida por IA"
                  : "Editor completo. Sem assistente de IA."}
              </CardDescription>
            </div>
            <div className="text-right">
              <p
                className="vox-mono text-[10px] uppercase tracking-wider"
                style={{ color: "var(--vox-forest)" }}
              >
                Mensal
              </p>
              <p
                className="mt-1 font-display text-xl"
                style={{
                  fontFamily: "var(--vox-font-display)",
                  color: "var(--vox-forest)",
                  letterSpacing: "-0.01em",
                }}
              >
                {PLAN_PRICE_BRL[plan]}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trocar de plano */}
      <Card>
        <CardHeader>
          <CardTitle>Trocar de plano</CardTitle>
          <CardDescription>
            Mude a qualquer momento. A cobrança é proporcional ao tempo
            restante do ciclo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PlanCard
            title="Manuscrito"
            tagline="Sem IA"
            price="Gratuito durante o lançamento"
            description="Editor, modelos, bíblia integrada e três modos de apresentação. Foco no essencial."
            active={plan === "manuscrito"}
            disabled={pending}
            onClick={() => switchPlan("manuscrito")}
          />
          <PlanCard
            title="Concílio"
            tagline="Com IA"
            price="R$ 19,90/mês"
            description="Tudo do Manuscrito + assistente de exegese. Cada texto que você prega ganha análise estruturada na barra lateral do editor."
            active={plan === "concilio"}
            disabled={pending}
            onClick={() => switchPlan("concilio")}
          />
        </CardContent>
      </Card>

      {/* Assistente de IA (só Concílio) */}
      {plan === "concilio" ? (
        <Card>
          <CardHeader>
            <CardTitle>Assistente de IA</CardTitle>
            <CardDescription>
              Liga e desliga o assistente sem precisar mudar de plano. Útil
              pra semanas em que você quer trabalhar só com o texto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <Label
                  htmlFor="ai-toggle"
                  className="font-medium cursor-pointer"
                >
                  Ativar assistente
                </Label>
                <p className="text-sm text-vox-prose mt-1">
                  Quando ativo, o botão de exegese aparece no editor de
                  sermão.
                </p>
              </div>
              <Switch
                id="ai-toggle"
                checked={enabled}
                onCheckedChange={onToggleAI}
                disabled={pending}
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
      ) : null}

      {/* Próxima cobrança */}
      <Card>
        <CardHeader>
          <CardTitle>Próxima cobrança</CardTitle>
          <CardDescription>
            Quando seu plano renova e qual valor será cobrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center"
            style={{ borderColor: "var(--vox-whisper-strong)" }}
          >
            <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
              Sem cobrança pendente
            </p>
            <p className="vox-body mt-2 text-sm text-vox-prose">
              {plan === "manuscrito"
                ? "Você está no plano gratuito de lançamento."
                : "A cobrança começa quando sairmos do período de lançamento. Você será avisado por email com 7 dias de antecedência."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de faturas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de faturas</CardTitle>
          <CardDescription>
            Faturas pagas e respectivos recibos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center"
            style={{ borderColor: "var(--vox-whisper-strong)" }}
          >
            <p className="vox-body text-sm text-vox-muted">
              Nenhuma fatura ainda.
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
  price,
  description,
  active,
  disabled,
  onClick,
}: {
  title: string;
  tagline: string;
  price: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || active}
      className="w-full text-left rounded-xl p-5 transition-colors disabled:cursor-not-allowed"
      style={{
        background: active ? "var(--vox-forest-soft)" : "var(--vox-surface)",
        border: active
          ? "1px solid var(--vox-forest)"
          : "1px solid var(--vox-whisper)",
        opacity: disabled && !active ? 0.6 : 1,
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h3
            className="vox-h3 text-lg"
            style={{ color: active ? "var(--vox-forest)" : "var(--vox-ink)" }}
          >
            {title}
          </h3>
          <span
            className="vox-mono text-[10px] uppercase tracking-wider"
            style={{
              color: active ? "var(--vox-forest)" : "var(--vox-muted)",
            }}
          >
            {active ? "Atual · " : ""}
            {tagline}
          </span>
        </div>
        <span
          className="vox-mono text-sm"
          style={{ color: active ? "var(--vox-forest)" : "var(--vox-prose)" }}
        >
          {price}
        </span>
      </div>
      <p className="vox-body mt-2 text-sm text-vox-prose">{description}</p>
      {!active ? (
        <p
          className="vox-mono text-[10px] uppercase tracking-wider mt-3"
          style={{ color: "var(--vox-forest)" }}
        >
          Clique para mudar →
        </p>
      ) : null}
    </button>
  );
}
