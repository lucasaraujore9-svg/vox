"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerAction, type ActionState } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils";

const initialState: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Criando conta…" : "Criar conta"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-vox-destructive">{message}</p>;
}

export function RegisterForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className={cn("space-y-5", className)} noValidate>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Como podemos te chamar"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="denomination">
          Denominação{" "}
          <span className="text-vox-muted text-xs font-normal">(opcional)</span>
        </Label>
        <Input
          id="denomination"
          name="denomination"
          type="text"
          placeholder="Igreja, ministério ou organização"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Pelo menos 8 caracteres"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repita a senha"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError message={state.fieldErrors?.confirmPassword} />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id="terms" name="terms" required />
        <Label htmlFor="terms" className="text-sm font-normal leading-5">
          Aceito os termos de uso e a política de privacidade do VOX.
        </Label>
      </div>
      <FieldError message={state.fieldErrors?.terms} />

      <SubmitButton />
    </form>
  );
}
