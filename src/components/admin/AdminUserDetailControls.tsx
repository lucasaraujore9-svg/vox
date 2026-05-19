"use client";

// Card de controles do usuário na página /admin/users/[id]:
//  - Plano (manuscrito × concílio)
//  - Status (ativo × desativado)
//  - Papel (usuario, admin, super_admin)

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  updateUserPlanAction,
  updateUserRoleAction,
  setUserActiveAction,
} from "@/lib/admin/users";
import type { AdminUser } from "@/lib/admin/queries";
import type { UserRole } from "@/types/database";

export function AdminUserDetailControls({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changePlan(plan: "manuscrito" | "concilio") {
    if (plan === user.plan) return;
    startTransition(async () => {
      const result = await updateUserPlanAction(user.id, plan);
      if (result.ok) {
        toast.success("Plano atualizado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
    });
  }

  function changeRole(role: UserRole) {
    if (role === user.role) return;
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role);
      if (result.ok) {
        toast.success("Papel atualizado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
    });
  }

  function toggleActive(nextActive: boolean) {
    if (!nextActive) {
      if (!confirm(`Desativar "${user.name}"?\nO usuário será deslogado e não poderá entrar até ser reativado.`)) {
        return;
      }
    }
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, nextActive);
      if (result.ok) {
        toast.success(nextActive ? "Usuário ativado" : "Usuário desativado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle</CardTitle>
        <CardDescription>
          Mudanças entram em vigor imediatamente. Desativar força logout em
          todas as sessões abertas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ctl-plan">Plano</Label>
            <Select
              value={user.plan}
              onValueChange={(v) => changePlan(v as "manuscrito" | "concilio")}
              disabled={pending}
            >
              <SelectTrigger id="ctl-plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manuscrito">Manuscrito (sem IA)</SelectItem>
                <SelectItem value="concilio">Concílio (com IA)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-vox-muted">
              Voltar pra Manuscrito desliga a IA automaticamente.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctl-role">Papel</Label>
            <Select
              value={user.role}
              onValueChange={(v) => changeRole(v as UserRole)}
              disabled={pending}
            >
              <SelectTrigger id="ctl-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-vox-muted">
              Apenas super_admin promove pra admin/super_admin.
            </p>
          </div>
        </div>

        <div
          className="rounded-lg p-4 flex items-start justify-between gap-6"
          style={{
            background: user.is_active
              ? "var(--vox-surface)"
              : "color-mix(in srgb, var(--vox-destructive) 8%, transparent)",
            border: `1px solid ${
              user.is_active
                ? "var(--vox-whisper)"
                : "var(--vox-destructive)"
            }`,
          }}
        >
          <div className="flex-1">
            <Label htmlFor="ctl-active" className="font-medium cursor-pointer">
              {user.is_active ? "Conta ativa" : "Conta desativada"}
            </Label>
            <p className="text-sm text-vox-prose mt-1">
              {user.is_active
                ? "Usuário pode entrar normalmente."
                : "Usuário não consegue logar. Ao tentar, recebe aviso de que está desativado."}
            </p>
          </div>
          <Switch
            id="ctl-active"
            checked={user.is_active}
            onCheckedChange={toggleActive}
            disabled={pending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
