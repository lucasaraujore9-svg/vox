// Página de detalhe de um usuário, exclusiva da área admin.
// Mostra perfil + controles (plano, ativar/desativar, papel, excluir) +
// listas de sermões e exegeses solicitadas.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  isCurrentUserAdmin,
  getAdminUserDetail,
  listUserSermons,
  listUserExegeses,
} from "@/lib/admin/queries";
import { AdminUserDetailControls } from "@/components/admin/AdminUserDetailControls";
import { AdminUserSermonsList } from "@/components/admin/AdminUserSermonsList";
import { AdminUserExegesesList } from "@/components/admin/AdminUserExegesesList";

export const metadata = { title: "Usuário · Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/dashboard");

  const { id } = await params;
  const [user, sermons, exegeses] = await Promise.all([
    getAdminUserDetail(id),
    listUserSermons(id),
    listUserExegeses(id),
  ]);

  if (!user) notFound();

  const totalCost = exegeses.reduce((acc, e) => acc + e.cost_usd, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/users"
            className="text-vox-muted hover:underline underline-offset-4"
          >
            ← Usuários
          </Link>
        </div>
        <p className="vox-eyebrow">Administração</p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="vox-h1">{user.name || "Sem nome"}</h1>
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
        </div>
        <p className="vox-mono text-sm text-vox-prose">{user.email}</p>
        {user.denomination ? (
          <p className="text-sm text-vox-muted">{user.denomination}</p>
        ) : null}
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
              Sermões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl" style={{ fontFamily: "var(--vox-font-display)" }}>
              {sermons.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
              Exegeses solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl" style={{ fontFamily: "var(--vox-font-display)" }}>
              {exegeses.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
              Custo IA acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl" style={{ fontFamily: "var(--vox-font-display)" }}>
              ${totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </section>

      <AdminUserDetailControls user={user} />

      <Tabs defaultValue="sermons" className="gap-6">
        <TabsList variant="line" className="w-full justify-start gap-2 border-b">
          <TabsTrigger value="sermons">Sermões ({sermons.length})</TabsTrigger>
          <TabsTrigger value="exegeses">Exegeses ({exegeses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sermons">
          <AdminUserSermonsList sermons={sermons} />
        </TabsContent>

        <TabsContent value="exegeses">
          <AdminUserExegesesList exegeses={exegeses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
