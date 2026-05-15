// Lista de interesses (solicitações de cadastro). Admin pode converter,
// rejeitar ou marcar como spam.

import { redirect } from "next/navigation";
import Link from "next/link";
import { listInterests, isCurrentUserAdmin } from "@/lib/admin/queries";
import { AdminInterestsList } from "@/components/admin/AdminInterestsList";

export const metadata = { title: "Interesses" };

interface PageProps {
  searchParams: Promise<{
    status?: "all" | "pending" | "invited" | "rejected" | "spam";
  }>;
}

export default async function AdminInterestsPage({ searchParams }: PageProps) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) redirect("/dashboard");

  const params = await searchParams;
  const filter = params.status ?? "pending";
  const interests = await listInterests(filter);

  const tabs: Array<{ id: typeof filter; label: string }> = [
    { id: "pending", label: "Pendentes" },
    { id: "invited", label: "Convidados" },
    { id: "rejected", label: "Rejeitados" },
    { id: "spam", label: "Spam" },
    { id: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <header>
        <p className="vox-eyebrow">Administração</p>
        <h1 className="vox-h1 mt-3">Interesses</h1>
        <p className="vox-body mt-3 max-w-xl">
          Solicitações de cadastro vindas da página pública. Avalie cada uma
          e converta em usuário, rejeite ou marque como spam.
        </p>
      </header>

      <div
        className="inline-flex rounded-md border p-0.5 flex-wrap"
        style={{ borderColor: "var(--vox-whisper)" }}
      >
        {tabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/interests?status=${tab.id}`}
              className="vox-mono text-xs px-3 py-1.5 rounded-sm transition-colors"
              style={{
                background: active ? "var(--vox-forest)" : "transparent",
                color: active ? "#fff" : "var(--vox-prose)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <AdminInterestsList interests={interests} />
    </div>
  );
}
