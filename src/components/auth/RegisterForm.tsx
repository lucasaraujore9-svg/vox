"use client";

// Formulário de "deixe seu interesse", o sistema é fechado, signup público
// está desligado. O super admin vê os interesses em /admin e libera quem
// julgar conveniente.

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  submitInterestAction,
  type InterestState,
} from "@/lib/interests/actions";
import { cn } from "@/lib/utils";

const initialState: InterestState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Enviando…" : "Enviar interesse"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-vox-destructive">{message}</p>;
}

export function RegisterForm({ className }: { className?: string }) {
  const [state, formAction] = useActionState(submitInterestAction, initialState);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (state.ok) setSubmitted(true);
  }, [state.ok]);

  if (submitted) {
    return (
      <div className={cn("space-y-5", className)}>
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: "var(--vox-forest-soft)",
            border: "1px solid var(--vox-forest)",
          }}
        >
          <p
            className="vox-eyebrow mb-3"
            style={{ color: "var(--vox-forest)" }}
          >
            Recebido
          </p>
          <h3 className="vox-h3 text-lg">Seu interesse foi registrado.</h3>
          <p className="vox-body text-sm mt-3">
            Vamos avaliar e entrar em contato pelo email que você deixou
            quando uma vaga estiver disponível. O VOX hoje é por convite.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-vox-prose hover:text-vox-ink underline-offset-4 hover:underline w-full"
        >
          Enviar outro interesse
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className={cn("space-y-5", className)} noValidate>
      <div
        className="rounded-lg p-4 text-sm"
        style={{
          background: "var(--vox-surface-deep)",
          border: "1px solid var(--vox-whisper)",
        }}
      >
        <p className="text-vox-prose">
          O VOX é por convite. Deixe seu contato abaixo e entraremos em
          contato quando uma vaga abrir.
        </p>
      </div>

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
        <Label htmlFor="denomination">
          Denominação ou organização{" "}
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
        <Label htmlFor="message">
          Como pretende usar?{" "}
          <span className="text-vox-muted text-xs font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Conte rapidamente seu contexto pastoral, frequência de pregação, etc."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
