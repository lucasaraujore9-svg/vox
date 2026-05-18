"use client";

// Apaga em definitivo, sem possibilidade de restaurar. Exige digitar o título
// como confirmação (padrão de "destructive action" usado em GitHub, Vercel, etc).

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { permanentDeleteSermonAction } from "@/lib/sermons/actions";

interface PermanentDeleteDialogProps {
  sermonId: string;
  sermonTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function PermanentDeleteDialog({
  sermonId,
  sermonTitle,
  open,
  onOpenChange,
  redirectTo,
}: PermanentDeleteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const expected = sermonTitle.trim();
  const matches = confirmation.trim() === expected;

  function handleConfirm() {
    if (!matches) return;
    setError(null);
    startTransition(async () => {
      const result = await permanentDeleteSermonAction(sermonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      setConfirmation("");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmation("");
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-vox-destructive">
            Apagar permanentemente
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-vox-ink">
              &ldquo;{sermonTitle}&rdquo;
            </span>{" "}
            será apagado definitivamente, incluindo histórico de versões e
            anotações. <strong>Esta ação não pode ser desfeita.</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Digite o título do manuscrito para confirmar:
          </Label>
          <Input
            id="confirm"
            autoFocus
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={expected}
          />
        </div>

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
            disabled={pending || !matches}
          >
            {pending ? "Apagando…" : "Apagar permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
