"use client";

// Dialog modal com a dica do framework escolhido.
// Mostrado automaticamente no wizard (se não silenciado) e reabrível pelo editor.

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { FRAMEWORK_HINTS, loadDismissed, persistDismissed } from "@/lib/frameworks/hints";

interface FrameworkHintDialogProps {
  framework: FrameworkId;
  /** Controle externo (botão "Dica" do editor) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Auto-open ao montar se framework não estiver silenciado */
  autoOpen?: boolean;
}

export function FrameworkHintDialog({
  framework,
  open: controlledOpen,
  onOpenChange,
  autoOpen = false,
}: FrameworkHintDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  // Auto-open: ao montar, abre se ainda não foi silenciado
  useEffect(() => {
    if (!autoOpen) return;
    const dismissed = loadDismissed();
    if (!dismissed.has(framework)) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, framework]);

  const hint = FRAMEWORK_HINTS[framework];
  const accent = `var(--vox-fw-${framework})`;

  function handleClose() {
    if (dontShow) {
      const dismissed = loadDismissed();
      dismissed.add(framework);
      persistDismissed(dismissed);
    }
    setOpen(false);
    setDontShow(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: accent }}
            />
            <p className="vox-eyebrow" style={{ color: accent }}>
              Modelo
            </p>
          </div>
          <DialogTitle
            className="mt-2"
            style={{ fontFamily: "var(--vox-font-display)", fontSize: "var(--vox-text-3xl)", letterSpacing: "-0.01em" }}
          >
            {hint.title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-vox-prose">
            {hint.body}
          </DialogDescription>
        </DialogHeader>

        <section className="mt-2 space-y-5">
          <div>
            <p className="vox-eyebrow mb-3">Princípios</p>
            <ul className="space-y-2 text-sm text-vox-prose">
              {hint.principles.map((p, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className="size-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: accent }}
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="vox-eyebrow mb-3" style={{ color: "var(--vox-destructive)" }}>
              Armadilhas
            </p>
            <ul className="space-y-2 text-sm text-vox-prose">
              {hint.pitfalls.map((p, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className="size-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: "var(--vox-destructive)" }}
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <DialogFooter className="flex sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mt-5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dont-show"
              checked={dontShow}
              onCheckedChange={(v) => setDontShow(v === true)}
            />
            <Label htmlFor="dont-show" className="text-sm font-normal text-vox-prose">
              Não mostrar mais para este modelo
            </Label>
          </div>
          <Button onClick={handleClose}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Helper pra apagar o silenciamento de um framework (caso o usuário queira). */
export function resetHintFor(framework: FrameworkId): void {
  const dismissed = loadDismissed();
  dismissed.delete(framework);
  persistDismissed(dismissed);
}
