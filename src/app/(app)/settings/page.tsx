// Issue 046, Configurações conectadas ao backend.
// Tabs: Perfil · Preferências · IA · Modelos · Blocos · Conta

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FrameworksGrid } from "@/components/sermon/FrameworksGrid";
import { SettingsProfileForm } from "@/components/settings/SettingsProfileForm";
import { SettingsPreferencesForm } from "@/components/settings/SettingsPreferencesForm";
import { SettingsAIForm } from "@/components/settings/SettingsAIForm";
import { SettingsPasswordForm } from "@/components/settings/SettingsPasswordForm";
import { SettingsDeleteAccount } from "@/components/settings/SettingsDeleteAccount";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Configurações" };

type BibleVersion = "ARC" | "ARA" | "NVI" | "NAA" | "NVT";

interface ProfileData {
  name: string;
  denomination: string | null;
  bible_version: BibleVersion;
  ai_enabled: boolean;
  email: string;
}

async function loadProfile(): Promise<ProfileData | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("name, denomination, bible_version, ai_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    name: data.name ?? "",
    denomination: data.denomination,
    bible_version: (data.bible_version as BibleVersion) ?? "ARC",
    ai_enabled: data.ai_enabled ?? false,
    email: user.email ?? "",
  };
}

export default async function SettingsPage() {
  const profile = await loadProfile();

  if (!profile) {
    return (
      <div className="max-w-3xl space-y-6">
        <header>
          <p className="vox-eyebrow">Conta · Preferências</p>
          <h1 className="vox-h1 mt-3">Configurações</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Não foi possível carregar seu perfil</CardTitle>
            <CardDescription>
              Verifique se você está autenticado e tente recarregar a página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <p className="vox-eyebrow">Conta · Preferências</p>
        <h1 className="vox-h1 mt-3">Configurações</h1>
        <p className="vox-body mt-3">
          Ajuste seu perfil, escolha sua tradução padrão, ative o módulo de IA
          e configure as cores dos blocos.
        </p>
      </header>

      <Tabs defaultValue="profile" className="gap-8">
        <TabsList variant="line" className="w-full justify-start gap-2 border-b">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="frameworks">Modelos</TabsTrigger>
          <TabsTrigger value="blocks">Blocos</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-5">
          <SettingsProfileForm
            initialName={profile.name}
            initialDenomination={profile.denomination}
            email={profile.email}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-5">
          <SettingsPreferencesForm initialVersion={profile.bible_version} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-5">
          <SettingsAIForm initialEnabled={profile.ai_enabled} />
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-5">
          <div>
            <p className="vox-eyebrow">Biblioteca</p>
            <h2 className="vox-h2 mt-2 text-2xl">Modelos homiléticos</h2>
            <p className="vox-body mt-3 max-w-2xl">
              Seis estruturas testadas no púlpito. Cada uma é uma postura, não
              uma fórmula. Escolha conforme o texto, a congregação e o momento.
            </p>
          </div>
          <FrameworksGrid />
        </TabsContent>

        <TabsContent value="blocks" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cores dos blocos</CardTitle>
              <CardDescription>
                Personalize a cor de cada tipo de bloco no editor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-vox-prose">
                Acesse a configuração detalhada em{" "}
                <Link
                  href="/settings/blocks"
                  className="text-vox-forest underline underline-offset-4 hover:no-underline"
                >
                  Configuração de cores
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-5">
          <SettingsPasswordForm />
          <SettingsDeleteAccount />
        </TabsContent>
      </Tabs>
    </div>
  );
}
