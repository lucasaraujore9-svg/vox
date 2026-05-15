"use client";

// Dialog de confirmação pra mover manuscrito pra lixeira.
// Chama softDeleteSermonAction (Server Action) + redireciona.

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
import { softDeleteSermonAction } from "@/lib/sermons/actions";

interface DeleteSermonDialogProps {
  sermonId: string;
  sermonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSermonDialog({
  sermonId,
  sermonTitle,
  open,
  onOpenChange,
}: DeleteSermonDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await softDeleteSermonAction(sermonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.push("/sermons");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover para a lixeira</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-vox-ink">&ldquo;{sermonTitle}&rdquo;</span>{" "}
            ficará arquivado por 30 dias. Você pode restaurar pela lixeira nesse
            período. Depois disso é removido em definitivo.
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
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "Movendo…" : "Mover para lixeira"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
