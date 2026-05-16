"use client";

// Workspace de notas: lista à esquerda + editor à direita.
// Em mobile, alterna entre lista e editor com botão "voltar".

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  FileText,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextItem } from "@/components/editor/RichTextItem";
import {
  archiveNoteAction,
  createNoteAction,
  permanentDeleteNoteAction,
  promoteNoteToSermonAction,
  unarchiveNoteAction,
  updateNoteAction,
} from "@/lib/notes/actions";
import { previewSnippet } from "@/lib/editor/html";
import { cn } from "@/lib/utils";

export interface NoteSummary {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  archived_at: string | null;
  updated_at: string;
}

interface NotesWorkspaceProps {
  initialNotes: NoteSummary[];
  initialSelectedId?: string;
  archivedView?: boolean;
}

const AUTOSAVE_DELAY = 1200;

export function NotesWorkspace({
  initialNotes,
  initialSelectedId,
  archivedView = false,
}: NotesWorkspaceProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteSummary[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? initialNotes[0]?.id ?? null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnMobile, setShowOnMobile] = useState<"list" | "editor">(
    initialSelectedId ? "editor" : "list"
  );
  const [pending, startTransition] = useTransition();

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Auto-save: por nota selecionada, dispara updateNoteAction com debounce
  const [draftTitle, setDraftTitle] = useState(selected?.title ?? "");
  const [draftContent, setDraftContent] = useState(selected?.content ?? "");
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  useEffect(() => {
    if (!selected) {
      setDraftTitle("");
      setDraftContent("");
      return;
    }
    setDraftTitle(selected.title);
    setDraftContent(selected.content);
    setSavingStatus("idle");
  }, [selected?.id]); // só ao trocar de nota

  useEffect(() => {
    if (!selected) return;
    if (draftTitle === selected.title && draftContent === selected.content) return;
    setSavingStatus("saving");
    const timer = setTimeout(async () => {
      const result = await updateNoteAction({
        id: selected.id,
        title: draftTitle,
        content: draftContent,
      });
      if (result.ok) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === selected.id
              ? {
                  ...n,
                  title: draftTitle,
                  content: draftContent,
                  updated_at: new Date().toISOString(),
                }
              : n
          )
        );
        setSavingStatus("saved");
      } else {
        toast.error("Falha ao salvar nota", { description: result.error });
        setSavingStatus("idle");
      }
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [draftTitle, draftContent, selected]);

  function selectNote(id: string) {
    setSelectedId(id);
    setShowOnMobile("editor");
  }

  function newNote() {
    startTransition(async () => {
      const result = await createNoteAction({});
      if (!result.ok) {
        toast.error("Não foi possível criar nota", { description: result.error });
        return;
      }
      router.refresh();
      const id = result.data?.id;
      if (id) {
        setNotes((prev) => [
          {
            id,
            title: "Nova nota",
            content: "",
            pinned: false,
            archived_at: null,
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        selectNote(id);
      }
    });
  }

  async function togglePin(note: NoteSummary) {
    const next = !note.pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n))
    );
    const result = await updateNoteAction({ id: note.id, pinned: next });
    if (!result.ok) {
      toast.error("Erro ao fixar", { description: result.error });
      // revert
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: !next } : n))
      );
    }
  }

  async function archive(note: NoteSummary) {
    const result = note.archived_at
      ? await unarchiveNoteAction(note.id)
      : await archiveNoteAction(note.id);
    if (!result.ok) {
      toast.error("Falha ao arquivar", { description: result.error });
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    if (selectedId === note.id) setSelectedId(null);
    toast.success(note.archived_at ? "Nota restaurada" : "Nota arquivada");
  }

  async function permaDelete(note: NoteSummary) {
    if (!confirm(`Apagar "${note.title}" permanentemente? Sem volta.`)) return;
    const result = await permanentDeleteNoteAction(note.id);
    if (!result.ok) {
      toast.error("Erro ao apagar", { description: result.error });
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    if (selectedId === note.id) setSelectedId(null);
    toast.success("Apagada");
  }

  async function promote(note: NoteSummary) {
    const result = await promoteNoteToSermonAction(note.id);
    if (!result.ok) {
      toast.error("Erro ao promover", { description: result.error });
      return;
    }
    toast.success("Nota virou manuscrito", {
      description: "Você foi levado pro editor.",
    });
    router.push(`/sermons/${result.data?.sermonId}`);
  }

  const visibleNotes = searchTerm.trim()
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : notes;

  return (
    <div
      className="flex gap-0 rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--vox-whisper)",
        background: "var(--vox-surface)",
        minHeight: "calc(100vh - 220px)",
      }}
    >
      {/* Sidebar de notas */}
      <aside
        className={cn(
          "flex flex-col w-full md:w-72 lg:w-80 shrink-0 border-r",
          "md:flex",
          showOnMobile === "list" ? "flex" : "hidden"
        )}
        style={{
          borderColor: "var(--vox-whisper)",
          background: "var(--vox-surface-elev)",
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--vox-whisper)" }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-vox-muted" />
            <Input
              placeholder="Buscar nas notas…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={newNote}
            disabled={pending}
            className="w-full mt-2 justify-start"
          >
            <Plus className="size-4 mr-1.5" />
            {pending ? "Criando…" : "Nova nota"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {visibleNotes.length === 0 ? (
            <div className="p-6 text-center text-sm text-vox-muted">
              {archivedView
                ? "Nenhuma nota arquivada."
                : searchTerm
                  ? "Nada encontrado."
                  : "Sem notas ainda. Crie a primeira."}
            </div>
          ) : (
            <ul>
              {visibleNotes.map((note) => {
                const active = note.id === selectedId;
                return (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => selectNote(note.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b transition-colors",
                        active
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      )}
                      style={{ borderColor: "var(--vox-whisper)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        {note.pinned ? (
                          <Pin
                            className="size-3 shrink-0 fill-current"
                            style={{ color: "var(--vox-gold)" }}
                          />
                        ) : null}
                        <p className="font-medium text-sm truncate flex-1">
                          {note.title || "Sem título"}
                        </p>
                      </div>
                      <p className="text-xs text-vox-muted mt-0.5 line-clamp-2">
                        {previewSnippet(note.content, 120) || "Sem conteúdo"}
                      </p>
                      <p className="vox-mono text-[10px] text-vox-muted mt-1">
                        {relativeTime(note.updated_at)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!archivedView ? (
          <div className="p-3 border-t" style={{ borderColor: "var(--vox-whisper)" }}>
            <a
              href="/notes?view=arquivo"
              className="text-xs text-vox-muted hover:text-vox-ink vox-mono"
            >
              Arquivadas →
            </a>
          </div>
        ) : (
          <div className="p-3 border-t" style={{ borderColor: "var(--vox-whisper)" }}>
            <a
              href="/notes"
              className="text-xs text-vox-muted hover:text-vox-ink vox-mono"
            >
              ← Voltar pras ativas
            </a>
          </div>
        )}
      </aside>

      {/* Editor */}
      <section
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          showOnMobile === "editor" ? "flex" : "hidden md:flex"
        )}
      >
        {selected ? (
          <>
            <header
              className="px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3"
              style={{ borderColor: "var(--vox-whisper)" }}
            >
              <button
                type="button"
                onClick={() => setShowOnMobile("list")}
                className="md:hidden text-vox-muted hover:text-vox-ink flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="size-4" />
                Lista
              </button>
              <div className="flex-1 min-w-0">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Título da nota"
                  className="border-0 px-0 focus-visible:ring-0 bg-transparent h-auto py-0.5"
                  style={{
                    fontFamily: "var(--vox-font-display)",
                    fontWeight: 600,
                    fontSize: "var(--vox-text-2xl)",
                    letterSpacing: "-0.01em",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="vox-mono text-[10px] hidden sm:inline"
                  style={{
                    color:
                      savingStatus === "saving"
                        ? "var(--vox-prose)"
                        : "var(--vox-muted)",
                  }}
                >
                  {savingStatus === "saving"
                    ? "Salvando…"
                    : savingStatus === "saved"
                      ? "Salvo"
                      : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePin(selected)}
                  aria-label={selected.pinned ? "Desafixar" : "Fixar"}
                  className="px-2"
                >
                  <Pin
                    className={cn(
                      "size-4",
                      selected.pinned && "fill-current"
                    )}
                    style={selected.pinned ? { color: "var(--vox-gold)" } : undefined}
                  />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onSelect={() => promote(selected)}>
                      <Sparkles className="size-4 mr-2" />
                      Promover pra manuscrito
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => archive(selected)}>
                      {selected.archived_at ? (
                        <>
                          <ArchiveRestore className="size-4 mr-2" />
                          Tirar do arquivo
                        </>
                      ) : (
                        <>
                          <Archive className="size-4 mr-2" />
                          Arquivar
                        </>
                      )}
                    </DropdownMenuItem>
                    {selected.archived_at ? (
                      <DropdownMenuItem
                        onSelect={() => permaDelete(selected)}
                        className="text-vox-destructive focus:text-vox-destructive"
                      >
                        <Trash2 className="size-4 mr-2" />
                        Apagar permanentemente
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
              <div className="max-w-3xl mx-auto">
                <RichTextItem
                  key={selected.id}
                  initialContent={draftContent}
                  placeholder="Comece a escrever…"
                  onChange={setDraftContent}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <FileText className="size-10 text-vox-muted mx-auto mb-3" />
              <p className="vox-h3 text-base mb-1">
                {archivedView
                  ? "Selecione uma nota arquivada"
                  : "Selecione uma nota"}
              </p>
              <p className="text-sm text-vox-muted">
                {archivedView
                  ? "Ou volte pras ativas e crie uma."
                  : "Ou crie uma nova com o botão acima."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
