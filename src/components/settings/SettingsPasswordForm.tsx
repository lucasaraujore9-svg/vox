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
import { updatePasswordAction } from "@/lib/profile/actions";

export function SettingsPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Senha precisa de ao menos 8 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    startTransition(async () => {
      const result = await updatePasswordAction({
        new_password: newPassword,
        confirm_password: confirm,
      });
      if (result.ok) {
        toast.success("Senha atualizada");
        setNewPassword("");
        setConfirm("");
      } else {
        toast.error(result.error ?? "Não foi possível atualizar a senha");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Senha</CardTitle>
        <CardDescription>Atualize sua senha de acesso.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="new_password">Nova senha</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="confirm_password">Confirmar nova senha</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending || !newPassword || !confirm}
            >
              {pending ? "Atualizando…" : "Atualizar senha"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
