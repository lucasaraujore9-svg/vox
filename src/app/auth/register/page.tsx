import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Solicitar acesso" };

export default function RegisterPage() {
  return (
    <div>
      <p className="vox-eyebrow">VOX · Acesso por convite</p>
      <h1 className="vox-h2 mt-3">Deixe seu interesse</h1>
      <p className="vox-body mt-3">
        Cadastros novos passam por curadoria. Preencha abaixo e entraremos
        em contato quando houver uma vaga.
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
