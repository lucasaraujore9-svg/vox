// Header da área autenticada. Issue 021 já wireia logout; conteúdo cresce em 001/049.

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/server";
import { OfflineBadge } from "@/components/shared/OfflineBadge";

function initialsFromName(name: string | null | undefined, email?: string) {
  const source = (name?.trim() || email?.split("@")[0] || "VO").toUpperCase();
  return source.slice(0, 2);
}

export async function AppHeader() {
  let displayName = "Pastor";
  let email = "";

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        email = user.email ?? "";
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle<{ name: string }>();
        const metaName =
          (user.user_metadata as { name?: string } | null | undefined)?.name ?? "";
        displayName = profile?.name || metaName || email || "Pastor";
      }
    } catch {
      // Supabase não disponível em dev — ignora
    }
  }

  return (
    <header className="flex items-center justify-end gap-3 mb-8">
      <span
        className="hidden md:inline-flex items-center gap-1.5 text-xs vox-mono text-vox-muted mr-1"
        aria-hidden
      >
        Buscar Bíblia
        <kbd
          className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] tracking-wide"
          style={{ borderColor: "var(--vox-whisper)", color: "var(--vox-prose)" }}
        >
          ⌘ B
        </kbd>
      </span>
      <OfflineBadge />
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="size-9 cursor-pointer">
            <AvatarFallback className="bg-accent text-vox-forest text-xs font-medium">
              {initialsFromName(displayName, email)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{displayName}</p>
            {email ? (
              <p className="text-xs font-normal text-vox-muted vox-mono">
                {email}
              </p>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">Configurações</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings/blocks">Cores dos blocos</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full text-left text-vox-destructive"
              >
                Sair
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
