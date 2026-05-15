"use client";

// Menu "..." no header do editor. Concentra todas as ações secundárias
// pra liberar espaço lateral.

import { useEffect, useState } from "react";
import {
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
import type { MockSermon } from "@/lib/mocks/sermons";

interface SermonActionsMenuProps {
  sermon: MockSermon;
}

export function SermonActionsMenu({ sermon }: SermonActionsMenuProps) {
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // NEXT_PUBLIC_SUPABASE_URL é exposto ao client; ausência = modo demo
    setIsDemoMode(!process.env.NEXT_PUBLIC_SUPABASE_URL);
  }, []);

  function handleExport(format: "pdf" | "docx" | "txt") {
    if (isDemoMode) {
      toast.error("Modo demo", {
        description:
          "Configure Supabase em .env.local pra exportar manuscritos. As exportações usam o conteúdo gravado no banco.",
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
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-vox-destructive focus:text-vox-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Mover para lixeira
          </DropdownMenuItem>
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
      <DeleteSermonDialog
        sermonId={sermon.id}
        sermonTitle={sermon.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
