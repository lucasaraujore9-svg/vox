// Painel de slides. Rail compacto de thumbs (180px) + área principal com a barra
// do slide + manuscrito (SermonEditor) por slide, com auto-save.
// Toda ação aqui é real: subir PDF/imagem, criar slide em branco, trocar a
// imagem de um slide e apagar slide.

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageUp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SermonEditor } from "@/components/editor/SermonEditor";
import { useAutoSave, type AutoSaveStatus } from "@/hooks/useAutoSave";
import { createClient } from "@/lib/supabase/client";
import {
  emptyContentFor,
  type SermonContent,
} from "@/lib/sermons/sessions";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { termsFor } from "@/lib/sermons/terminology";
import { uploadSlideSources } from "@/lib/sermons/slide-sources";
import type { ContentType } from "@/types/database";
import { cn } from "@/lib/utils";

/** Fase do envio, só pra rotular o botão com a verdade do que está rolando. */
type UploadStage = "idle" | "sending" | "converting";

/**
 * Lê a resposta da API exigindo JSON. Com a sessão expirada o middleware
 * redireciona para o login e a resposta vira HTML com status 200 — sem esta
 * checagem isso passaria por "sucesso, 0 slides".
 */
async function readJson<T extends { error?: string }>(res: Response): Promise<T> {
  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  if (!isJson) {
    throw new Error("Sua sessão expirou. Recarregue a página e tente de novo.");
  }
  const body = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) throw new Error(body?.error ?? `Erro ${res.status}`);
  return (body ?? ({} as T));
}

export interface SlideItem {
  id: string;
  order: number;
  image_url?: string;
  comment_items?: SermonContent | null;
  comment?: string;
}

interface SlidesPanelProps {
  /** Necessário pra subir arquivo e salvar comentário. Sem ele o painel é só leitura. */
  sermonId?: string;
  slides: SlideItem[];
  framework?: FrameworkId;
  contentType?: ContentType;
  className?: string;
}

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*";

export function SlidesPanel({
  sermonId,
  slides,
  framework = "livre",
  contentType = "sermão",
  className,
}: SlidesPanelProps) {
  const router = useRouter();
  const terms = termsFor(contentType);
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialContents = useMemo(
    () =>
      Object.fromEntries(
        slides.map((s) => [
          s.id,
          s.comment_items ?? legacyToContent(s.comment, framework),
        ])
      ) as Record<string, SermonContent>,
    [slides, framework]
  );

  const selected =
    slides.find((s) => s.id === selectedId) ?? slides[0] ?? null;
  const selectedIdx = selected ? slides.findIndex((s) => s.id === selected.id) : -1;
  const isEmpty = slides.length === 0;

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!sermonId || busy) return;
      const list = Array.from(files);
      if (list.length === 0) return;
      setBusy(true);
      setStage("sending");
      try {
        // O arquivo vai direto pro Storage; a rota recebe só o caminho.
        const sources = await uploadSlideSources(createClient(), sermonId, list);
        setStage("converting");
        const res = await fetch(
          `/api/sermons/slides/upload?sermonId=${sermonId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sources }),
          }
        );
        const body = await readJson<{ error?: string; slidesCreated?: number }>(res);
        const count = body.slidesCreated ?? 0;
        toast.success(
          count === 1 ? "1 slide adicionado" : `${count} slides adicionados`
        );
        router.refresh();
      } catch (err) {
        toast.error("Não consegui subir os slides", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setStage("idle");
        setBusy(false);
      }
    },
    [sermonId, busy, router]
  );

  const addBlankSlide = useCallback(async () => {
    if (!sermonId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sermons/slides/manual?sermonId=${sermonId}`, {
        method: "POST",
      });
      await readJson(res);
      toast.success("Slide em branco criado");
      router.refresh();
    } catch (err) {
      toast.error("Não consegui criar o slide", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }, [sermonId, busy, router]);

  const replaceImage = useCallback(
    async (slideId: string, file: File) => {
      if (!sermonId) return;
      setBusy(true);
      setStage("sending");
      try {
        const [source] = await uploadSlideSources(createClient(), sermonId, [file]);
        setStage("converting");
        const res = await fetch(`/api/sermons/slides/${slideId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source }),
        });
        await readJson(res);
        toast.success("Imagem trocada");
        router.refresh();
      } catch (err) {
        toast.error("Não consegui trocar a imagem", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setStage("idle");
        setBusy(false);
      }
    },
    [sermonId, router]
  );

  const deleteSlide = useCallback(async () => {
    if (!deletingId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sermons/slides/${deletingId}`, {
        method: "DELETE",
      });
      await readJson(res);
      toast.success("Slide apagado");
      if (selectedId === deletingId) setSelectedId(null);
      setDeletingId(null);
      router.refresh();
    } catch (err) {
      toast.error("Não consegui apagar o slide", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }, [deletingId, selectedId, router]);

  const canEdit = Boolean(sermonId);

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-5", className)}>
      {/* Rail compacto de slides */}
      <aside
        className="rounded-lg overflow-hidden border bg-card self-start sticky top-4"
        style={{ borderColor: "var(--vox-whisper)" }}
      >
        <div
          className="px-3 py-2.5 border-b flex items-center justify-between"
          style={{ borderColor: "var(--vox-whisper)" }}
        >
          <p className="vox-eyebrow text-[10px]">Slides</p>
          <span className="vox-mono text-xs text-vox-muted">{slides.length}</span>
        </div>
        <div className="p-2 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {isEmpty ? (
            <p className="px-1 py-4 text-xs text-vox-prose text-center">
              Nenhum slide ainda.
            </p>
          ) : (
            slides.map((slide) => {
              const isActive = selected?.id === slide.id;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedId(slide.id)}
                  className={cn(
                    "block w-full rounded-md overflow-hidden text-left transition-all border",
                    isActive ? "shadow-[var(--vox-shadow-card)]" : "hover:opacity-90"
                  )}
                  style={{
                    borderColor: isActive ? "var(--vox-forest)" : "var(--vox-whisper)",
                    borderWidth: isActive ? "1.5px" : "1px",
                  }}
                >
                  <div
                    className="aspect-video flex items-center justify-center relative"
                    style={{
                      background: slide.image_url
                        ? `url(${slide.image_url}) center / cover`
                        : "var(--vox-surface-deep)",
                    }}
                  >
                    {!slide.image_url ? (
                      <span
                        className="vox-mono text-base"
                        style={{
                          color: isActive ? "var(--vox-forest)" : "var(--vox-muted)",
                          opacity: 0.6,
                        }}
                      >
                        {String(slide.order).padStart(2, "0")}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span
                      className="vox-mono text-[10px]"
                      style={{
                        color: isActive ? "var(--vox-forest)" : "var(--vox-muted)",
                      }}
                    >
                      {String(slide.order).padStart(2, "0")}
                    </span>
                  </div>
                </button>
              );
            })
          )}

          {canEdit ? (
            <div className="pt-1 space-y-1">
              <FilePickerButton
                accept={ACCEPT}
                multiple
                disabled={busy}
                onFiles={(files) => void uploadFiles(files)}
                className="w-full text-xs h-auto py-1.5"
              >
                + Arquivo
              </FilePickerButton>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-auto py-1.5"
                disabled={busy}
                onClick={() => void addBlankSlide()}
              >
                + Em branco
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Área principal */}
      <section className="space-y-5 min-w-0">
        {isEmpty ? (
          <SlideDropzone
            disabled={!canEdit || busy}
            stage={stage}
            onFiles={(files) => void uploadFiles(files)}
            onBlank={() => void addBlankSlide()}
            contentLabel={`${terms.demonstrative === "este" ? "deste" : "desta"} ${terms.labelLower}`}
          />
        ) : selected ? (
          <>
            <SlideHeaderBar
              slide={selected}
              index={selectedIdx}
              total={slides.length}
              canEdit={canEdit}
              busy={busy}
              onReplace={(file) => void replaceImage(selected.id, file)}
              onDelete={() => setDeletingId(selected.id)}
            />
            <div>
              <p className="vox-eyebrow text-xs mb-3 text-vox-prose">
                Manuscrito do slide
              </p>
              <SlideCommentEditor
                key={selected.id}
                slideId={selected.id}
                framework={framework}
                initialContent={initialContents[selected.id] ?? emptyContentFor(framework)}
                canSave={canEdit}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center min-h-[400px] text-sm text-vox-muted">
            Selecione um slide para adicionar comentários
          </div>
        )}
      </section>

      <Dialog
        open={deletingId !== null}
        onOpenChange={(o) => !o && !busy && setDeletingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apagar este slide?</DialogTitle>
            <DialogDescription>
              A imagem e o manuscrito deste slide serão removidos. Essa ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeletingId(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              onClick={() => void deleteSlide()}
              disabled={busy}
              style={{ background: "var(--vox-destructive, #B91C1C)", color: "#fff" }}
            >
              {busy ? "Apagando…" : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Estado vazio de verdade: arrasta o arquivo, escolhe do disco ou começa em branco. */
function SlideDropzone({
  disabled,
  stage,
  onFiles,
  onBlank,
  contentLabel,
}: {
  disabled: boolean;
  stage: UploadStage;
  onFiles: (files: FileList | File[]) => void;
  onBlank: () => void;
  contentLabel: string;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className="rounded-xl border-2 border-dashed p-10 text-center transition-colors"
      style={{
        borderColor: dragging ? "var(--vox-forest)" : "var(--vox-whisper-strong)",
        background: dragging ? "var(--vox-surface-deep)" : "transparent",
      }}
    >
      <Upload
        className="size-6 mx-auto mb-4"
        style={{ color: "var(--vox-muted)" }}
        aria-hidden
      />
      <h3 className="vox-h3 text-base">Suba os slides {contentLabel}</h3>
      <p className="vox-body text-sm mt-2 max-w-md mx-auto">
        Arraste um PDF aqui, ou escolha do computador. Cada página vira um slide.
        Também aceita PNG, JPG e WebP.
      </p>

      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        <FilePickerButton
          accept={ACCEPT}
          multiple
          disabled={disabled}
          onFiles={onFiles}
          variant="default"
          size="default"
        >
          {stage === "sending"
            ? "Enviando…"
            : stage === "converting"
              ? "Convertendo…"
              : "Escolher arquivo"}
        </FilePickerButton>
        <Button variant="outline" onClick={onBlank} disabled={disabled}>
          Começar em branco
        </Button>
      </div>

      <p className="text-xs text-vox-muted mt-5">
        Para PPT ou Keynote, exporte como PDF antes de subir. Até 50MB por arquivo.
      </p>
    </div>
  );
}

/** Botão que abre o seletor de arquivos. Encapsula o input escondido. */
function FilePickerButton({
  accept,
  multiple = false,
  disabled,
  onFiles,
  children,
  className,
  variant = "ghost",
  size = "sm",
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList | File[]) => void;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) onFiles(files);
          // Permite re-selecionar o mesmo arquivo depois de um erro.
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </Button>
    </>
  );
}

/** Barra fina no topo: thumb + slide N + ações do slide. */
function SlideHeaderBar({
  slide,
  index,
  total,
  canEdit,
  busy,
  onReplace,
  onDelete,
}: {
  slide: SlideItem;
  index: number;
  total: number;
  canEdit: boolean;
  busy: boolean;
  onReplace: (file: File) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-lg bg-card border p-4 flex items-center gap-4"
      style={{ borderColor: "var(--vox-whisper)" }}
    >
      {/* Miniatura à esquerda */}
      <div
        className="aspect-video w-32 rounded-md overflow-hidden shrink-0 flex items-center justify-center relative"
        style={{
          background: "var(--vox-surface-deep)",
          border: "1px solid var(--vox-whisper)",
        }}
      >
        {slide.image_url ? (
          <Image
            src={slide.image_url}
            alt={`Slide ${slide.order}`}
            fill
            sizes="128px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="vox-mono text-2xl" style={{ color: "var(--vox-muted)" }}>
            {String(slide.order).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p className="vox-eyebrow" style={{ color: "var(--vox-forest)" }}>
            Slide {String(slide.order).padStart(2, "0")}
          </p>
          <span className="vox-mono text-xs text-vox-muted">
            {index + 1} de {total}
          </span>
        </div>
        <p className="vox-body text-sm text-vox-prose mt-1.5">
          Manuscrito estruturado · siga o modelo como num esboço.
        </p>
      </div>

      {/* Ações do slide */}
      {canEdit ? (
        <div className="flex gap-2 shrink-0">
          <FilePickerButton
            accept=".png,.jpg,.jpeg,.webp,image/*"
            disabled={busy}
            variant="outline"
            onFiles={(files) => {
              const file = Array.from(files)[0];
              if (file) onReplace(file);
            }}
          >
            <ImageUp className="size-3.5 mr-1.5" />
            {slide.image_url ? "Trocar imagem" : "Pôr imagem"}
          </FilePickerButton>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={busy}
            aria-label="Apagar slide"
            title="Apagar slide"
            className="text-vox-muted hover:text-vox-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const SAVE_LABEL: Record<AutoSaveStatus, string> = {
  idle: "Salvo",
  dirty: "Editando…",
  saving: "Salvando…",
  saved: "Salvo",
  offline: "Salvo localmente · sincroniza quando voltar online",
};

/** Manuscrito de um slide com auto-save em `slides.comment_items`. */
function SlideCommentEditor({
  slideId,
  framework,
  initialContent,
  canSave,
}: {
  slideId: string;
  framework: FrameworkId;
  initialContent: SermonContent;
  canSave: boolean;
}) {
  const [content, setContent] = useState<SermonContent>(initialContent);

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const save = useCallback(
    async (next: SermonContent) => {
      if (!canSave || !supabase) return;
      const payload = JSON.parse(JSON.stringify(next));
      const { error } = await supabase
        .from("slides")
        .update({ comment_items: payload })
        .eq("id", slideId);
      if (error) throw error;
    },
    [slideId, supabase, canSave]
  );

  const status = useAutoSave({
    value: content,
    save,
    fallbackId: `slide:${slideId}`,
  });

  const statusColor =
    status === "offline"
      ? "var(--vox-gold)"
      : status === "saving" || status === "dirty"
        ? "var(--vox-prose)"
        : "var(--vox-muted)";

  return (
    <div className="space-y-3">
      {canSave ? (
        <div className="flex justify-end">
          <span
            className="vox-mono text-[11px]"
            style={{ color: statusColor }}
            aria-live="polite"
          >
            {SAVE_LABEL[status]}
          </span>
        </div>
      ) : null}
      <SermonEditor
        framework={framework}
        initialContent={initialContent}
        onChange={setContent}
      />
    </div>
  );
}

function legacyToContent(legacy: string | undefined, framework: FrameworkId): SermonContent {
  if (!legacy?.trim()) return emptyContentFor(framework);
  return {
    sessions: [
      {
        id: cryptoRandomId(),
        title: "Anotações",
        role: "livre",
        order: 1,
        items: [
          {
            id: cryptoRandomId(),
            type: "notas_pessoais",
            content: legacy,
            order: 1,
          },
        ],
      },
    ],
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 12);
}
