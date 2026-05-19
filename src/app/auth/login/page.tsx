import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata = { title: "Entrar" };

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const deactivated = reason === "deactivated";

  return (
    <div>
      <p className="vox-eyebrow">VOX · Entrada</p>
      <h1 className="vox-h2 mt-3">Continuar manuscrito</h1>
      <p className="vox-body mt-3">
        Acesse seu banco de sermões, palestras e aulas.
      </p>

      {deactivated ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            Sua conta foi desativada. Entre em contato com um administrador.
          </AlertDescription>
        </Alert>
      ) : null}

      <LoginForm className="mt-8" />

      <p className="text-sm text-vox-prose mt-8">
        Ainda não tem conta?{" "}
        <Link
          href="/auth/register"
          className="text-vox-forest hover:underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
