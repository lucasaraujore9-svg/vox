// Painel super admin de IA: configuração global + relatório de uso por usuário.

import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminAISettingsForm } from "@/components/admin/AdminAISettingsForm";
import { AdminAIUsageTable } from "@/components/admin/AdminAIUsageTable";
import { isCurrentUserAdmin } from "@/lib/admin/queries";
import {
  getAISettingsForAdmin,
  listAIUsage,
} from "@/lib/admin/ai-queries";
import type { AIUsagePeriod } from "@/lib/admin/ai-types";

export const metadata = { title: "IA · Admin" };

interface PageProps {
  searchParams: Promise<{ period?: AIUsagePeriod; tab?: string }>;
}

export default async function AdminAIPage({ searchParams }: PageProps) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/dashboard");

  const params = await searchParams;
  const period: AIUsagePeriod = params.period ?? "30d";
  const tab = params.tab === "usage" ? "usage" : "settings";

  const [settings, usage] = await Promise.all([
    getAISettingsForAdmin(),
    listAIUsage(period),
  ]);

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <p className="vox-eyebrow">Administração</p>
        <h1 className="vox-h1 mt-3">IA</h1>
        <p className="vox-body mt-3 max-w-xl">
          Escolha o modelo, ajuste preços e acompanhe o gasto por usuário. As
          mudanças valem para todas as chamadas de IA do sistema (exegese,
          sugestões no editor).
        </p>
      </header>

      <Tabs defaultValue={tab} className="gap-8">
        <TabsList variant="line" className="w-full justify-start gap-2 border-b">
          <TabsTrigger value="settings">Configuração</TabsTrigger>
          <TabsTrigger value="usage">Uso e custos</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-5">
          {settings ? (
            <AdminAISettingsForm initial={settings} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Configuração indisponível</CardTitle>
                <CardDescription>
                  A tabela de configuração ainda não foi criada. Aplique a
                  migration 024.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-5">
          {usage ? (
            <AdminAIUsageTable report={usage} period={period} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sem dados</CardTitle>
                <CardDescription>
                  Nenhum uso registrado ainda.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
