"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfileBasicAction } from "@/lib/profile/actions";

interface Props {
  initialName: string;
  initialDenomination: string | null;
  email: string;
}

export function SettingsProfileForm({
  initialName,
  initialDenomination,
  email,
}: Props) {
  const [name, setName] = useState(initialName);
  const [denomination, setDenomination] = useState(initialDenomination ?? "");
  const [pending, startTransition] = useTransition();

  const dirty =
    name.trim() !== initialName.trim() ||
    denomination.trim() !== (initialDenomination ?? "").trim();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileBasicAction({
        name: name.trim(),
        denomination: denomination.trim() || null,
      });
      if (result.ok) {
        toast.success("Perfil atualizado");
      } else {
        toast.error(result.error ?? "Não foi possível salvar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações pessoais</CardTitle>
        <CardDescription>Como você aparece no VOX.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pr. Lucas"
              required
              minLength={2}
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="denomination">
              Denominação ou organização{" "}
              <span className="text-vox-muted text-xs font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="denomination"
              name="denomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="Igreja, ministério..."
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled />
            <p className="text-xs text-vox-muted">
              Email não pode ser alterado por aqui. Entre em contato pelo
              suporte.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
