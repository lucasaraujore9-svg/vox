import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <div>
      <p className="vox-eyebrow">VOX · Nova conta</p>
      <h1 className="vox-h2 mt-3">Começar manuscritos</h1>
      <p className="vox-body mt-3">
        Crie sua conta para preparar, pregar e arquivar.
      </p>

      <RegisterForm className="mt-8" />

      <p className="text-sm text-vox-prose mt-8">
        Já tem conta?{" "}
        <Link
          href="/auth/login"
          className="text-vox-forest hover:underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
