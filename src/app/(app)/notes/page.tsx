// Página de Notas. Lista lateral + editor.
// Query `?view=arquivo` mostra arquivadas. `?id=<uuid>` seleciona uma nota.

import { NotesWorkspace } from "@/components/notes/NotesWorkspace";
import { listNotes } from "@/lib/notes/queries";
import Link from "next/link";

export const metadata = { title: "Notas" };

interface PageProps {
  searchParams: Promise<{
    view?: "arquivo";
    id?: string;
  }>;
}

export default async function NotesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const archivedView = params.view === "arquivo";

  const notes = await listNotes({
    archived: archivedView ? "archived" : "active",
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="vox-eyebrow">
            {archivedView ? "Arquivadas" : "Inbox pastoral"}
          </p>
          <h1 className="vox-h1 mt-3">
            {archivedView ? "Notas arquivadas" : "Notas"}
          </h1>
          <p className="vox-body mt-3 max-w-xl">
            {archivedView
              ? "Notas fora da inbox. Você pode restaurar ou apagar permanentemente."
              : "Rascunhos rápidos. Ideias, citações, observações da semana. Quando virar sermão, promova com um clique."}
          </p>
        </div>
        {archivedView ? (
          <Link
            href="/notes"
            className="text-sm text-vox-prose hover:text-vox-ink"
          >
            ← Voltar pras ativas
          </Link>
        ) : null}
      </header>

      <NotesWorkspace
        initialNotes={notes}
        initialSelectedId={params.id}
        archivedView={archivedView}
      />
    </div>
  );
}
