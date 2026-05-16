"use client";

// Menu "..." no header do editor. Concentra todas as ações secundárias.
// Quando o manuscrito está arquivado, exibe "Desarquivar" + "Apagar permanente".

import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  FileDown,
  Info,
  Lightbulb,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
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
  const [isDemoMode, setIsDemoMode] = useState(false);

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
            Sobre este manuscrito
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setMetadataOpen(true)}>
            <Info className="size-4 mr-2" />
            Metadados
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHintOpen(true)}>
            <Lightbulb className="size-4 mr-2" />
            Dica do framework
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
    </>
  );
}
