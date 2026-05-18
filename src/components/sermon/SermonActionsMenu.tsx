"use client";

// Menu "..." no header do editor. Concentra todas as ações secundárias.
// Quando o manuscrito está arquivado, exibe "Desarquivar" + "Apagar permanente".

import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Circle,
  FileDown,
  FolderTree,
  Info,
  Lightbulb,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FrameworkHintDialog } from "@/components/sermon/FrameworkHintDialog";
import { MetadataDialog } from "@/components/sermon/MetadataDialog";
import { DeleteSermonDialog } from "@/components/sermon/DeleteSermonDialog";
import { ArchiveSermonDialog } from "@/components/sermon/ArchiveSermonDialog";
import { PermanentDeleteDialog } from "@/components/sermon/PermanentDeleteDialog";
import { LinkSeriesDialog } from "@/components/sermon/LinkSeriesDialog";
import { updateSermonMetaAction } from "@/lib/sermons/actions";
import type { MockSermon } from "@/lib/mocks/sermons";

interface SermonActionsMenuProps {
  sermon: MockSermon;
  /** Quando true, mostra ações de "Desarquivar" e "Apagar permanente" no lugar de "Arquivar". */
  isArchived?: boolean;
}

export function SermonActionsMenu({
  sermon,
  isArchived = false,
}: SermonActionsMenuProps) {
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [permDeleteOpen, setPermDeleteOpen] = useState(false);
  const [linkSeriesOpen, setLinkSeriesOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const router = useRouter();
  const isDraft = sermon.status === "rascunho";

  useEffect(() => {
    setIsDemoMode(!process.env.NEXT_PUBLIC_SUPABASE_URL);
  }, []);

  function handleExport(format: "pdf" | "docx" | "txt") {
    if (isDemoMode) {
      toast.error("Modo demo", {
        description:
          "Configure Supabase em .env.local pra exportar manuscritos.",
      });
      return;
    }
    window.location.href = `/api/sermons/export?sermonId=${sermon.id}&format=${format}`;
  }

  async function handleStatusToggle() {
    if (isDemoMode) {
      toast.error("Modo demo", {
        description: "Configure Supabase em .env.local pra alterar o status.",
      });
      return;
    }
    if (statusBusy) return;
    setStatusBusy(true);
    const nextStatus = isDraft ? "pronto" : "rascunho";
    const res = await updateSermonMetaAction({ id: sermon.id, status: nextStatus });
    setStatusBusy(false);
    if (!res.ok) {
      toast.error("Falha ao atualizar status", { description: res.error });
      return;
    }
    toast.success(
      nextStatus === "pronto"
        ? "Marcado como pregado"
        : "Voltou para rascunho"
    );
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Mais ações"
            className="px-2"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="vox-eyebrow text-[10px]">
            Status
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void handleStatusToggle();
            }}
            disabled={statusBusy}
          >
            {isDraft ? (
              <>
                <CheckCircle2
                  className="size-4 mr-2"
                  style={{ color: "var(--vox-forest)" }}
                />
                Marcar como pregado
              </>
            ) : (
              <>
                <Circle className="size-4 mr-2 text-vox-muted" />
                Voltar para rascunho
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="vox-eyebrow text-[10px]">
            Organização
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setLinkSeriesOpen(true)}>
            <FolderTree className="size-4 mr-2" />
            {sermon.series ? "Mudar de série…" : "Vincular a série…"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="vox-eyebrow text-[10px]">
            Sobre este manuscrito
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setMetadataOpen(true)}>
            <Info className="size-4 mr-2" />
            Metadados
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHintOpen(true)}>
            <Lightbulb className="size-4 mr-2" />
            Dica do modelo
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="vox-eyebrow text-[10px]">
            Exportar
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => handleExport("pdf")}>
            <FileDown className="size-4 mr-2" />
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("docx")}>
            <FileDown className="size-4 mr-2" />
            Exportar DOCX
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleExport("txt")}>
            <FileDown className="size-4 mr-2" />
            Exportar TXT
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {isArchived ? (
            <>
              <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
                <ArchiveRestore className="size-4 mr-2" />
                Tirar do arquivo
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setPermDeleteOpen(true)}
                className="text-vox-destructive focus:text-vox-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Apagar permanentemente
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
                <Archive className="size-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTrashOpen(true)}
                className="text-vox-destructive focus:text-vox-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Mover para lixeira
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <MetadataDialog
        sermon={sermon}
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
      />
      <FrameworkHintDialog
        framework={sermon.framework}
        open={hintOpen}
        onOpenChange={setHintOpen}
      />
      <ArchiveSermonDialog
        sermonId={sermon.id}
        sermonTitle={sermon.title}
        mode={isArchived ? "unarchive" : "archive"}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
      <DeleteSermonDialog
        sermonId={sermon.id}
        sermonTitle={sermon.title}
        open={trashOpen}
        onOpenChange={setTrashOpen}
      />
      <PermanentDeleteDialog
        sermonId={sermon.id}
        sermonTitle={sermon.title}
        open={permDeleteOpen}
        onOpenChange={setPermDeleteOpen}
        redirectTo="/sermons?view=arquivo"
      />
      <LinkSeriesDialog
        sermonId={sermon.id}
        currentSeriesId={sermon.series?.id ?? null}
        open={linkSeriesOpen}
        onOpenChange={setLinkSeriesOpen}
      />
    </>
  );
}
