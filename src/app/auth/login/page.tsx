import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div>
      <p className="vox-eyebrow">VOX · Entrada</p>
      <h1 className="vox-h2 mt-3">Continuar manuscrito</h1>
      <p className="vox-body mt-3">
        Acesse seu banco de sermões, palestras e aulas.
      </p>

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
