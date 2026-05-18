// Issue 034, Página de importação. Liga em /api/sermons/import.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Mode = "file" | "text";

export default function ImportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("file");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Traga sermões existentes do Word, do bloco de notas ou de qualquer manuscrito antigo.
          A estrutura é detectada por títulos comuns (introdução, ponto, aplicação…).
        </p>
      </header>

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
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="text">Texto</Label>
          <Textarea
            id="text"
            name="text"
            rows={12}
            placeholder="Cole o manuscrito aqui. Use linhas em branco entre seções e títulos curtos."
            required
          />
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
