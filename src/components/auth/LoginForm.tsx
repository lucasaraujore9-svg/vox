"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction, type ActionState } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils";

const initialState: ActionState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}

export function LoginForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className={cn("space-y-5", className)} noValidate>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

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
        {state.fieldErrors?.email ? (
          <p className="text-xs text-vox-destructive">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Pelo menos 8 caracteres"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-vox-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
