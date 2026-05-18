"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccountAction } from "@/lib/profile/actions";

export function SettingsDeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result.ok) {
        toast.success("Conta excluída");
        router.push("/auth/login");
      } else {
        toast.error(result.error ?? "Não foi possível excluir a conta");
      }
    });
  }

  return (
    <Card style={{ borderColor: "rgba(225,29,72,0.3)" }}>
      <CardHeader>
        <CardTitle style={{ color: "var(--vox-destructive)" }}>
          Excluir conta
        </CardTitle>
        <CardDescription>
          Esta ação é irreversível. Seus sermões serão arquivados por 30 dias e
          depois removidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" type="button">
              Excluir minha conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                Digite <strong>excluir</strong> abaixo para confirmar. Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">Confirmação</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="excluir"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={pending || confirmText.trim().toLowerCase() !== "excluir"}
              >
                {pending ? "Excluindo…" : "Excluir conta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
