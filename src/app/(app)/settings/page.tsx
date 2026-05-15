// Issue 014 — Configurações de Perfil (proto).
// Tabs: Perfil · Preferências · IA · Blocos · Conta
// Behavior real entra em 046.

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FrameworksGrid } from "@/components/sermon/FrameworksGrid";

export const metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <p className="vox-eyebrow">Conta · Preferências</p>
        <h1 className="vox-h1 mt-3">Configurações</h1>
        <p className="vox-body mt-3">
          Ajuste seu perfil, escolha sua tradução padrão, ative o módulo de IA e
          configure as cores dos blocos.
        </p>
      </header>

      <Tabs defaultValue="profile" className="gap-8">
        <TabsList variant="line" className="w-full justify-start gap-2 border-b">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="blocks">Blocos</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Informações pessoais</CardTitle>
              <CardDescription>Como você aparece no VOX.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Pr. Lucas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="denomination">Denominação ou organização</Label>
                <Input
                  id="denomination"
                  name="denomination"
                  placeholder="Igreja, ministério..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" disabled value="você@email.com" />
                <p className="text-xs text-vox-muted">
                  Email não pode ser alterado por aqui. Entre em contato pelo suporte.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Bíblia</CardTitle>
              <CardDescription>
                Tradução padrão usada no editor e nas buscas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="bible_version">Tradução padrão</Label>
                <Select defaultValue="ARC">
                  <SelectTrigger id="bible_version">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARC">ARC — Almeida Revista e Corrigida</SelectItem>
                    <SelectItem value="ARA">ARA — Almeida Revista e Atualizada</SelectItem>
                    <SelectItem value="NVI">NVI — Nova Versão Internacional</SelectItem>
                    <SelectItem value="NAA">NAA — Nova Almeida Atualizada</SelectItem>
                    <SelectItem value="NVT">NVT — Nova Versão Transformadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Assistente de IA</CardTitle>
              <CardDescription>
                Sugestão de estrutura, ilustrações e referências bíblicas —
                opcional e desligado por padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <Label htmlFor="ai-toggle" className="font-medium cursor-pointer">
                    Ativar assistente
                  </Label>
                  <p className="text-sm text-vox-prose mt-1">
                    Quando ativo, um botão &ldquo;Assistente&rdquo; aparece no editor.
                    Suas notas nunca são enviadas para treinamento.
                  </p>
                </div>
                <Switch id="ai-toggle" />
              </div>
              <div
                className="rounded-lg border p-4 text-sm text-vox-prose"
                style={{
                  background: "var(--vox-surface-deep)",
                  borderColor: "var(--vox-whisper)",
                }}
              >
                <p className="font-medium text-vox-ink mb-1">Política de privacidade</p>
                <p>
                  O conteúdo do sermão é enviado apenas no momento do pedido e
                  descartado depois. Nenhum manuscrito é armazenado ou usado para
                  treinar modelos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks" className="space-y-5">
          <div>
            <p className="vox-eyebrow">Biblioteca</p>
            <h2 className="vox-h2 mt-2 text-2xl">Frameworks homiléticos</h2>
            <p className="vox-body mt-3 max-w-2xl">
              Seis estruturas testadas no púlpito. Cada uma é uma postura —
              não uma fórmula. Escolha conforme o texto, a congregação e o momento.
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
          <Card>
            <CardHeader>
              <CardTitle>Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="current_password">Senha atual</Label>
                <Input id="current_password" type="password" />
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="new_password">Nova senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Atualizar senha</Button>
              </div>
            </CardContent>
          </Card>

          <Card style={{ borderColor: "rgba(225,29,72,0.3)" }}>
            <CardHeader>
              <CardTitle style={{ color: "var(--vox-destructive)" }}>
                Excluir conta
              </CardTitle>
              <CardDescription>
                Esta ação é irreversível. Seus sermões serão arquivados por 30 dias
                e depois removidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" type="button">
                Excluir minha conta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
