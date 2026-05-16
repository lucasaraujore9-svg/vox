"use client";

// Confirmação leve pra arquivar / desarquivar. Não é destrutivo —
// só esconde do banco principal e move pra /sermons?view=arquivo.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  archiveSermonAction,
  unarchiveSermonAction,
} from "@/lib/sermons/actions";

interface ArchiveSermonDialogProps {
  sermonId: string;
  sermonTitle: string;
  mode: "archive" | "unarchive";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveSermonDialog({
  sermonId,
  sermonTitle,
  mode,
  open,
  onOpenChange,
}: ArchiveSermonDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isArchive = mode === "archive";

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = isArchive
        ? await archiveSermonAction(sermonId)
        : await unarchiveSermonAction(sermonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isArchive ? "Arquivar manuscrito" : "Tirar do arquivo"}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-vox-ink">
              &ldquo;{sermonTitle}&rdquo;
            </span>{" "}
            {isArchive
              ? "vai sair do banco principal e ficar disponível em Arquivados. Você pode restaurar a qualquer momento."
              : "volta para o banco principal."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={pending}>
            {pending
              ? isArchive
                ? "Arquivando…"
                : "Restaurando…"
              : isArchive
                ? "Arquivar"
                : "Tirar do arquivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
