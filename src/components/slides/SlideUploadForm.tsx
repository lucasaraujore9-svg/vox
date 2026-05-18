// Issue 038, Upload de slides (PDF) ou link Google Slides.
// Conecta com /api/sermons/slides/upload.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Mode = "upload" | "google_slides" | "manual";

export function SlideUploadForm({ sermonId }: { sermonId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "upload") {
        const form = new FormData(e.currentTarget);
        const res = await fetch(`/api/sermons/slides/upload?sermonId=${sermonId}`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        router.refresh();
      } else if (mode === "google_slides") {
        const formData = new FormData(e.currentTarget);
        const url = String(formData.get("url") ?? "").trim();
        if (!url) throw new Error("Cole o link do Google Slides");
        // Para Google Slides: salva a URL no sermon e cria 1 slide placeholder
        const res = await fetch(`/api/sermons/slides/google?sermonId=${sermonId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        router.refresh();
      } else {
        // manual, cria slide vazio
        const res = await fetch(`/api/sermons/slides/manual?sermonId=${sermonId}`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Erro ${res.status}`);
        }
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => setMode("upload")}
          size="sm"
        >
          PDF
        </Button>
        <Button
          type="button"
          variant={mode === "google_slides" ? "default" : "outline"}
          onClick={() => setMode("google_slides")}
          size="sm"
        >
          Google Slides
        </Button>
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          size="sm"
        >
          Em branco
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {mode === "upload" ? (
        <div className="space-y-2">
          <Label htmlFor="file">Arquivo PDF (até 50MB)</Label>
          <Input id="file" name="file" type="file" accept=".pdf,application/pdf" required />
          <p className="text-xs text-vox-muted">
            Para PPT, exporte como PDF no PowerPoint ou Keynote antes de subir.
          </p>
        </div>
      ) : null}

      {mode === "google_slides" ? (
        <div className="space-y-2">
          <Label htmlFor="url">URL do Google Slides</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://docs.google.com/presentation/d/…"
            required
          />
          <p className="text-xs text-vox-muted">
            A apresentação precisa estar como &ldquo;qualquer pessoa com o link&rdquo;.
          </p>
        </div>
      ) : null}

      {mode === "manual" ? (
        <p className="text-sm text-vox-prose">
          Criamos um slide em branco para você começar a adicionar comentários.
        </p>
      ) : null}

      <Button type="submit" disabled={busy} size="lg">
        {busy ? "Processando…" : "Adicionar slides"}
      </Button>
    </form>
  );
}
