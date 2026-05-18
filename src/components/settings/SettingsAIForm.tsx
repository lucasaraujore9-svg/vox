"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateAISettingsAction } from "@/lib/profile/actions";

export function SettingsAIForm({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function onToggle(next: boolean) {
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
    <Card>
      <CardHeader>
        <CardTitle>Assistente de IA</CardTitle>
        <CardDescription>
          Sugestão de estrutura, ilustrações e exegese — opcional e desligado
          por padrão.
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
              Quando ativo, um botão &ldquo;Assistente&rdquo; aparece no
              editor. Suas notas nunca são enviadas para treinamento.
            </p>
          </div>
          <Switch
            id="ai-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
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
            O conteúdo do sermão é enviado apenas no momento do pedido e
            descartado depois. Nenhum manuscrito é armazenado ou usado para
            treinar modelos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
