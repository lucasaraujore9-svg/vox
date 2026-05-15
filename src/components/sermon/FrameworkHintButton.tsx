"use client";

// Botão "Dica do framework" no editor. Reabre o dialog mesmo se foi silenciado.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FrameworkHintDialog } from "@/components/sermon/FrameworkHintDialog";
import type { FrameworkId } from "@/lib/mocks/frameworks";

export function FrameworkHintButton({ framework }: { framework: FrameworkId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        Dica do framework
      </Button>
      <FrameworkHintDialog framework={framework} open={open} onOpenChange={setOpen} />
    </>
  );
}
