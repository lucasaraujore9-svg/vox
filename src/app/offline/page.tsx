// Fallback servido pelo SW quando o usuário tenta navegar offline
// pra uma página que ainda não foi cacheada.

import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="max-w-md text-center space-y-5">
        <p className="vox-eyebrow">Sem conexão</p>
        <h1 className="vox-h1">Você está offline</h1>
        <p className="vox-body">
          Esta página ainda não está disponível offline. Volte ao{" "}
          <Link
            href="/dashboard"
            className="text-vox-forest underline-offset-4 hover:underline"
          >
            painel
          </Link>{" "}
          ou abra um manuscrito que você já visitou — o conteúdo continua
          editável e será sincronizado quando a conexão voltar.
        </p>
        <p className="vox-mono text-xs text-vox-muted">
          Seus rascunhos estão a salvo no dispositivo.
        </p>
      </div>
    </main>
  );
}
