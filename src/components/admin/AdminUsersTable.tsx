"use client";

// Tabela de usuários — admin altera role, super_admin pode excluir.

import { useTransition } from "react";
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
      className="rounded-xl border overflow-hidden bg-card"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      <table className="w-full text-sm">
        <thead
          className="text-xs text-vox-muted vox-mono uppercase"
          style={{ borderBottom: "1px solid var(--vox-whisper)" }}
        >
          <tr>
            <th className="text-left px-5 py-3">Nome</th>
            <th className="text-left px-5 py-3">Email</th>
            <th className="text-left px-5 py-3">Papel</th>
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
              <td className="px-5 py-3 font-medium">{user.name || "—"}</td>
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
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="vox-eyebrow text-[10px]">
                      Mudar papel
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
