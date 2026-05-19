"use client";

// Tabela de usuários. Mostra papel, plano e status; admin altera todos,
// super_admin pode excluir. Clicar no nome leva pra página de detalhe.

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  updateUserRoleAction,
  updateUserPlanAction,
  setUserActiveAction,
  deleteUserAction,
} from "@/lib/admin/users";
import type { UserRole } from "@/types/database";
import type { AdminUser } from "@/lib/admin/queries";

const ROLE_LABEL: Record<string, string> = {
  pastor: "Pastor",
  admin: "Admin",
  super_admin: "Super admin",
};

const ROLE_COLOR: Record<string, string> = {
  pastor: "var(--vox-prose)",
  admin: "var(--vox-forest)",
  super_admin: "var(--vox-gold)",
};

const PLAN_LABEL: Record<string, string> = {
  manuscrito: "Manuscrito",
  concilio: "Concílio",
};

const PLAN_COLOR: Record<string, string> = {
  manuscrito: "var(--vox-prose)",
  concilio: "var(--vox-forest)",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);
      if (result.ok) {
        toast.success("Papel atualizado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
    });
  }

  function handlePlanChange(userId: string, plan: "manuscrito" | "concilio") {
    startTransition(async () => {
      const result = await updateUserPlanAction(userId, plan);
      if (result.ok) {
        toast.success("Plano atualizado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
    });
  }

  function handleToggleActive(userId: string, currentlyActive: boolean, name: string) {
    const nextActive = !currentlyActive;
    if (!nextActive) {
      if (!confirm(`Desativar "${name}"?\nO usuário será deslogado e não poderá entrar até ser reativado.`)) {
        return;
      }
    }
    startTransition(async () => {
      const result = await setUserActiveAction(userId, nextActive);
      if (result.ok) {
        toast.success(nextActive ? "Usuário ativado" : "Usuário desativado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro");
      }
    });
  }

  function handleDelete(userId: string, name: string) {
    if (!confirm(`Excluir definitivamente "${name}"?\nIsso remove a conta e todos os dados associados.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (result.ok) {
        toast.success("Usuário excluído");
        router.refresh();
      } else {
        toast.error(result.error ?? "Erro");
      }
    });
  }

  if (users.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center"
        style={{ borderColor: "var(--vox-whisper-strong)" }}
      >
        <p className="vox-body text-sm">
          Nenhum usuário cadastrado ainda. Use o botão acima pra criar o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-card overflow-x-auto"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      <table className="w-full text-sm min-w-[860px]">
        <thead
          className="text-xs text-vox-muted vox-mono uppercase"
          style={{ borderBottom: "1px solid var(--vox-whisper)" }}
        >
          <tr>
            <th className="text-left px-5 py-3">Nome</th>
            <th className="text-left px-5 py-3">Email</th>
            <th className="text-left px-5 py-3">Papel</th>
            <th className="text-left px-5 py-3">Plano</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Criado em</th>
            <th className="text-left px-5 py-3">Último acesso</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-accent/30 transition-colors"
              style={{ borderBottom: "1px solid var(--vox-whisper)" }}
            >
              <td className="px-5 py-3 font-medium">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="hover:underline underline-offset-4"
                  style={{ color: "var(--vox-forest)" }}
                >
                  {user.name || "—"}
                </Link>
              </td>
              <td className="px-5 py-3 vox-mono text-xs">{user.email || "—"}</td>
              <td className="px-5 py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor: ROLE_COLOR[user.role],
                    color: ROLE_COLOR[user.role],
                  }}
                >
                  {ROLE_LABEL[user.role] ?? user.role}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor: PLAN_COLOR[user.plan] ?? "var(--vox-prose)",
                    color: PLAN_COLOR[user.plan] ?? "var(--vox-prose)",
                  }}
                >
                  {PLAN_LABEL[user.plan] ?? user.plan}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant="outline"
                  className="text-xs font-normal"
                  style={{
                    borderColor: user.is_active
                      ? "var(--vox-forest)"
                      : "var(--vox-destructive)",
                    color: user.is_active
                      ? "var(--vox-forest)"
                      : "var(--vox-destructive)",
                  }}
                >
                  {user.is_active ? "Ativo" : "Desativado"}
                </Badge>
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-muted">
                {formatDate(user.created_at)}
              </td>
              <td className="px-5 py-3 vox-mono text-xs text-vox-muted">
                {formatDate(user.last_sign_in_at)}
              </td>
              <td className="px-2 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      aria-label="Ações"
                      disabled={pending}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/users/${user.id}`}>Ver detalhes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="vox-eyebrow text-[10px]">
                      Plano
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => handlePlanChange(user.id, "manuscrito")}
                      disabled={user.plan === "manuscrito"}
                    >
                      Manuscrito (sem IA)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handlePlanChange(user.id, "concilio")}
                      disabled={user.plan === "concilio"}
                    >
                      Concílio (com IA)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="vox-eyebrow text-[10px]">
                      Papel
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => handleRoleChange(user.id, "pastor")}
                      disabled={user.role === "pastor"}
                    >
                      Pastor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleRoleChange(user.id, "admin")}
                      disabled={user.role === "admin"}
                    >
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleRoleChange(user.id, "super_admin")}
                      disabled={user.role === "super_admin"}
                    >
                      Super admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() =>
                        handleToggleActive(user.id, user.is_active, user.name)
                      }
                    >
                      {user.is_active ? "Desativar usuário" : "Reativar usuário"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleDelete(user.id, user.name)}
                      className="text-vox-destructive focus:text-vox-destructive"
                    >
                      Excluir usuário
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
