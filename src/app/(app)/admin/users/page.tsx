// Área super admin: lista de usuários + criação de novo + edição de role.
// Server Component que carrega a lista; client component handles forms.

import { redirect } from "next/navigation";
import Link from "next/link";
import { listUsers, isCurrentUserAdmin } from "@/lib/admin/queries";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";

export const metadata = { title: "Usuários" };

export default async function AdminUsersPage() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/dashboard");

  const users = await listUsers();

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="vox-eyebrow">Administração</p>
          <h1 className="vox-h1 mt-3">Usuários</h1>
          <p className="vox-body mt-3 max-w-xl">
            Apenas administradores gerenciam contas. O sistema é por convite —
            ninguém se cadastra sozinho. Use também a página de{" "}
            <Link href="/admin/interests" className="text-vox-forest underline-offset-4 hover:underline">
              interesses
            </Link>{" "}
            para converter solicitações em contas.
          </p>
        </div>
        <CreateUserDialog />
      </header>

      <AdminUsersTable users={users} />
    </div>
  );
}
