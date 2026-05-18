"use client";

// Form do super admin pra configurar a IA:
// - Modelo ativo (select com os preços cadastrados)
// - Tabela de preços por modelo (editável)
// - Cap mensal por usuário em USD
//
// Salva via updateAdminAISettingsAction.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateAdminAISettingsAction } from "@/lib/admin/ai";
import type { AISettings, ModelPrice } from "@/lib/admin/ai-types";

interface ModelRow {
  model: string;
  input: string;
  output: string;
}

function toRows(prices: Record<string, ModelPrice>): ModelRow[] {
  return Object.entries(prices).map(([model, p]) => ({
    model,
    input: String(p.input),
    output: String(p.output),
  }));
}

export function AdminAISettingsForm({ initial }: { initial: AISettings }) {
  const router = useRouter();
  const [activeModel, setActiveModel] = useState(initial.active_model);
  const [rows, setRows] = useState<ModelRow[]>(toRows(initial.model_prices));
  const [cap, setCap] = useState(String(initial.monthly_user_cap_usd));
  const [pending, startTransition] = useTransition();

  function updateRow(idx: number, patch: Partial<ModelRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { model: "", input: "0", output: "0" }]);
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function onSave() {
    const prices: Record<string, ModelPrice> = {};
    for (const r of rows) {
      const model = r.model.trim();
      if (!model) continue;
      const input = Number(r.input);
      const output = Number(r.output);
      if (Number.isNaN(input) || Number.isNaN(output) || input < 0 || output < 0) {
        toast.error(`Preço inválido em ${model}`);
        return;
      }
      prices[model] = { input, output };
    }
    if (!prices[activeModel]) {
      toast.error("O modelo ativo precisa ter preço cadastrado");
      return;
    }
    const capNum = Number(cap);
    if (Number.isNaN(capNum) || capNum < 0) {
      toast.error("Limite mensal inválido");
      return;
    }
    startTransition(async () => {
      const result = await updateAdminAISettingsAction({
        active_model: activeModel,
        model_prices: prices,
        monthly_user_cap_usd: capNum,
      });
      if (result.ok) {
        toast.success("Configuração salva");
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível salvar");
      }
    });
  }

  const availableModels = rows
    .map((r) => r.model.trim())
    .filter((m) => m.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelo ativo</CardTitle>
          <CardDescription>
            O modelo usado em todas as chamadas de IA (exegese, sugestões).
            Trocar afeta novos pedidos imediatamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label htmlFor="active_model">Modelo</Label>
            <Select value={activeModel} onValueChange={setActiveModel}>
              <SelectTrigger id="active_model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preços por modelo</CardTitle>
          <CardDescription>
            USD por 1 milhão de tokens. Usado pra calcular custo de cada
            chamada no relatório.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[1fr_120px_120px_auto] gap-3 items-center text-xs font-medium text-vox-muted uppercase tracking-wider">
            <div>Modelo</div>
            <div>Input / 1M</div>
            <div>Output / 1M</div>
            <div />
          </div>
          {rows.map((r, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_120px_120px_auto] gap-3 items-center"
            >
              <Input
                value={r.model}
                onChange={(e) => updateRow(idx, { model: e.target.value })}
                placeholder="gpt-4o"
                className="vox-mono text-sm"
              />
              <Input
                value={r.input}
                onChange={(e) => updateRow(idx, { input: e.target.value })}
                type="number"
                step="0.01"
                min="0"
                className="vox-mono text-sm"
              />
              <Input
                value={r.output}
                onChange={(e) => updateRow(idx, { output: e.target.value })}
                type="number"
                step="0.01"
                min="0"
                className="vox-mono text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="text-xs text-vox-muted hover:text-vox-destructive px-2"
                disabled={pending}
              >
                Remover
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={pending}
          >
            + Adicionar modelo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limite mensal por usuário</CardTitle>
          <CardDescription>
            Gasto máximo (USD) que cada usuário pode acumular por mês. 0
            desabilita o limite. Recomendado manter entre US$ 3 e US$ 10.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="cap">Cap mensal (USD)</Label>
            <Input
              id="cap"
              type="number"
              step="0.5"
              min="0"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              className="vox-mono"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Salvando…" : "Salvar configuração"}
        </Button>
      </div>
    </div>
  );
}
