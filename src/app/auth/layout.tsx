import Link from "next/link";
import { VoxWordmark } from "@/components/brand/VoxWordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr]">
      <aside
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ background: "var(--vox-surface-elev)" }}
      >
        <Link href="/" className="inline-flex" aria-label="VOX">
          <VoxWordmark height={32} priority />
        </Link>
        <div className="max-w-md">
          <p className="vox-eyebrow">Companheiro silencioso do púlpito</p>
          <h2 className="vox-h2 mt-3">
            Manuscritos cuidadosos. Pregação sem fricção.
          </h2>
          <p className="vox-body mt-5">
            Prepare em modelos homiléticos, pregue em modo apresentação,
            arquive cada sermão para a memória do ministério.
          </p>
        </div>
        <p className="vox-mono text-xs text-vox-muted">© VOX</p>
      </aside>
      <main className="flex flex-col justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-sm mx-auto">{children}</div>
      </main>
    </div>
  );
}
