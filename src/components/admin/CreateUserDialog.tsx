"use client";

// Dialog pra criar novo usuário direto. Usa createUserAction.
// Aceita prefill (vindo da página de interesses).

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createUserAction } from "@/lib/admin/users";
import type { UserRole } from "@/types/database";

interface CreateUserDialogProps {
  /** Pré-preenchimento vindo de uma solicitação de interesse */
  prefill?: {
    email?: string;
    name?: string;
    denomination?: string;
    interestId?: string;
  };
  trigger?: React.ReactNode;
  /** Permite controlar abertura externamente */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function generatePassword(): string {
  // Senha forte com 14 chars: pelo menos 1 mai, 1 min, 1 num, 1 simb
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const nums = "23456789";
  const syms = "!@#$%&*-_";
  const all = upper + lower + nums + syms;
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    nums[Math.floor(Math.random() * nums.length)],
    syms[Math.floor(Math.random() * syms.length)],
  ];
  const remaining = Array.from({ length: 10 }).map(
    () => all[Math.floor(Math.random() * all.length)]
  );
  const combined = [...required, ...remaining];
  // shuffle
  for (let i = combined.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j]!, combined[i]!];
  }
  return combined.join("");
}

export function CreateUserDialog({
  prefill,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CreateUserDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [email, setEmail] = useState(prefill?.email ?? "");
  const [name, setName] = useState(prefill?.name ?? "");
  const [denomination, setDenomination] = useState(prefill?.denomination ?? "");
  const [password, setPassword] = useState(() => generatePassword());
  const [role, setRole] = useState<UserRole>("pastor");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(prefill?.email ?? "");
      setName(prefill?.name ?? "");
      setDenomination(prefill?.denomination ?? "");
      setPassword(generatePassword());
      setRole("pastor");
      setError(null);
      setCreated(null);
    }
  }, [open, prefill]);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createUserAction({
        email: email.trim(),
        name: name.trim(),
        password,
        denomination: denomination.trim() || undefined,
        role,
        fromInterestId: prefill?.interestId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated({ email: result.email, password });
      toast.success("Usuário criado");
      router.refresh();
    });
  }

  async function copyCredentials() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(
        `Email: ${created.email}\nSenha: ${created.password}`
      );
      toast.success("Credenciais copiadas");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ?? (
        <DialogTrigger asChild>
          <Button size="lg">+ Novo usuário</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Usuário criado</DialogTitle>
              <DialogDescription>
                Anote ou copie as credenciais agora. Por segurança, a senha
                inicial não pode ser recuperada depois.
              </DialogDescription>
            </DialogHeader>
            <div
              className="rounded-lg p-4 space-y-2 vox-mono text-sm"
              style={{
                background: "var(--vox-surface-deep)",
                border: "1px solid var(--vox-whisper)",
              }}
            >
              <p>
                <span className="text-vox-muted">Email:</span> {created.email}
              </p>
              <p>
                <span className="text-vox-muted">Senha:</span> {created.password}
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={copyCredentials}>
                Copiar credenciais
              </Button>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {prefill ? "Converter interesse em usuário" : "Novo usuário"}
              </DialogTitle>
              <DialogDescription>
                A conta é criada com email já confirmado. Anote a senha gerada
                e repasse pelo canal apropriado.
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cu-name">Nome</Label>
                <Input
                  id="cu-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pr. Lucas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-email">Email</Label>
                <Input
                  id="cu-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pastor@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-denom">Denominação (opcional)</Label>
                <Input
                  id="cu-denom"
                  value={denomination}
                  onChange={(e) => setDenomination(e.target.value)}
                  placeholder="Igreja, ministério..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-password">Senha inicial</Label>
                <div className="flex gap-2">
                  <Input
                    id="cu-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="vox-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPassword(generatePassword())}
                  >
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-vox-muted">
                  Senha gerada automaticamente, anote ou copie depois de criar.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cu-role">Papel</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger id="cu-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pastor">Pastor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={pending}>
                {pending ? "Criando…" : "Criar usuário"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
