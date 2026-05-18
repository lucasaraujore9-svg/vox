// Issue 034, Página de importação. Liga em /api/sermons/import.
// Suporta dois fluxos:
//   - Upload de arquivo (.docx / .txt) — ideal com o modelo VOX preenchido.
//   - Colar texto — com botão "inserir estrutura modelo" pra pré-preencher
//     com as tags `## sessão` e `@bloco`.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QUICK_TEMPLATE, listBlockTags } from "@/lib/import/template";

type Mode = "file" | "text";

export default function ImportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("file");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [showTags, setShowTags] = useState(false);
  const tags = listBlockTags();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/sermons/import", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as { id: string };
      router.push(`/sermons/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <header>
        <p className="vox-eyebrow">Migração</p>
        <h1 className="vox-h1 mt-3">Importar manuscrito</h1>
        <p className="vox-body mt-3">
          Traga sermões existentes do Word, do bloco de notas ou de qualquer manuscrito
          antigo. Para o melhor resultado, baixe o modelo VOX abaixo, preencha com seu
          conteúdo e suba o arquivo — cada bloco e cada sessão vai pro lugar certo.
        </p>
      </header>

      {/* Bloco do modelo: orientação principal, sempre visível. */}
      <section className="rounded-lg border border-border bg-card/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="vox-eyebrow">Recomendado</p>
            <h2 className="vox-h3 mt-2">Modelo de importação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Arquivo .txt com instruções e exemplo pronto. Edite e reenviavia.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a
              href="/api/sermons/import/template"
              download="modelo-manuscrito-vox.txt"
            >
              Baixar modelo .txt
            </a>
          </Button>
        </div>

        <details
          className="text-sm"
          open={showTags}
          onToggle={(e) => setShowTags((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer select-none text-foreground/80 hover:text-foreground">
            Ver tags suportadas ({tags.length})
          </summary>
          <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            <div className="col-span-full text-xs text-muted-foreground mb-1">
              Use <code className="font-mono">## Título da sessão</code> para
              sessões e as tags abaixo para blocos:
            </div>
            {tags.map((t) => (
              <div key={t.tag} className="flex items-baseline gap-2 text-xs">
                <code className="font-mono text-foreground">{t.tag}</code>
                <span className="text-muted-foreground truncate">{t.label}</span>
              </div>
            ))}
          </div>
        </details>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "file" ? "default" : "outline"}
          onClick={() => setMode("file")}
        >
          Upload de arquivo
        </Button>
        <Button
          type="button"
          variant={mode === "text" ? "default" : "outline"}
          onClick={() => setMode("text")}
        >
          Colar texto
        </Button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            placeholder="Como aparecerá no banco"
            required
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bible_ref">Referência bíblica (opcional)</Label>
            <Input id="bible_ref" name="bible_ref" placeholder="Ex: Romanos 5:1—11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_type">Tipo</Label>
            <select
              id="content_type"
              name="content_type"
              defaultValue="sermão"
              className="w-full h-10 rounded-md border border-input px-3 text-sm bg-card"
            >
              <option value="sermão">Sermão</option>
              <option value="palestra">Palestra</option>
              <option value="aula">Aula</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="framework">Modelo (estrutura sugerida)</Label>
          <select
            id="framework"
            name="framework"
            defaultValue="livre"
            className="w-full h-10 rounded-md border border-input px-3 text-sm bg-card"
          >
            <option value="livre">Livre, sem estrutura imposta</option>
            <option value="expositivo">Expositivo</option>
            <option value="textual">Textual</option>
            <option value="narrativo">Narrativo</option>
            <option value="tematico">Temático</option>
            <option value="topico">Tópico</option>
          </select>
        </div>
      </div>

      {mode === "file" ? (
        <div className="space-y-2">
          <Label htmlFor="file">Arquivo (.docx ou .txt, até 10MB)</Label>
          <Input id="file" name="file" type="file" accept=".docx,.txt,text/plain" required />
          <p className="text-xs text-muted-foreground">
            Dica: arquivos no formato do modelo VOX preservam sessões e tipos de
            bloco exatos. Arquivos comuns são lidos por heurística (títulos viram
            cabeçalhos, parágrafos viram conteúdo).
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="text">Texto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setText((prev) => (prev ? prev : QUICK_TEMPLATE))}
              >
                Inserir estrutura
              </Button>
              {text ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setText("")}
                >
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>
          <Textarea
            id="text"
            name="text"
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "Cole o manuscrito aqui. Para precisão máxima, use as tags VOX:\n\n## Introdução\n@texto_biblico Romanos 5:1-11\n@introducao\nConteúdo da introdução…"
            }
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            Sem tags, a estrutura é detectada por heurística (cabeçalhos comuns
            como “Introdução”, “Ponto 1”, “Aplicação”, “Conclusão”).
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Importando…" : "Importar"}
        </Button>
      </div>
    </form>
  );
}
