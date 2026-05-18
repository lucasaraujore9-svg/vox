"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { updatePreferencesAction } from "@/lib/profile/actions";

type BibleVersion = "ARC" | "ARA" | "NVI" | "NAA" | "NVT";

const VERSIONS: { value: BibleVersion; label: string }[] = [
  { value: "ARC", label: "ARC, Almeida Revista e Corrigida" },
  { value: "ARA", label: "ARA, Almeida Revista e Atualizada" },
  { value: "NVI", label: "NVI, Nova Versão Internacional" },
  { value: "NAA", label: "NAA, Nova Almeida Atualizada" },
  { value: "NVT", label: "NVT, Nova Versão Transformadora" },
];

export function SettingsPreferencesForm({
  initialVersion,
}: {
  initialVersion: BibleVersion;
}) {
  const [version, setVersion] = useState<BibleVersion>(initialVersion);
  const [pending, startTransition] = useTransition();
  const dirty = version !== initialVersion;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updatePreferencesAction({ bible_version: version });
      if (result.ok) {
        toast.success("Preferência salva");
      } else {
        toast.error(result.error ?? "Não foi possível salvar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bíblia</CardTitle>
        <CardDescription>
          Tradução padrão usada no editor e nas buscas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="bible_version">Tradução padrão</Label>
            <Select
              value={version}
              onValueChange={(v) => setVersion(v as BibleVersion)}
            >
              <SelectTrigger id="bible_version">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERSIONS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
