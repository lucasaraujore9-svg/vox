"use client";

// Menu lateral colapsável. Persistido em localStorage.
// Estados:
//   expandido (240px) → mostra wordmark + label + ícone, dropdown VOX no topo, chevron pra recolher
//   colapsado (64px)  → mostra só monograma V + ícones com tooltip on hover
// Ativa item conforme pathname (match exato OU prefix-of /href/...).

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  Settings,
  Upload,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import { VoxMark } from "@/components/brand/VoxMark";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/sermons", label: "Esboços", icon: FileText },
  { href: "/bible", label: "Bíblia", icon: BookMarked },
  { href: "/courses", label: "Cursos", icon: GraduationCap },
  { href: "/study", label: "Estudo", icon: BookOpen },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

const STORAGE_KEY = "vox.sidebar-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage indisponível
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignora
      }
      return next;
    });
  }

  // SSR-safe: até montar, renderiza expandido pra evitar hydration mismatch
  const showCollapsed = mounted && collapsed;

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    if (href === "/dashboard") return false;
    return pathname.startsWith(href + "/");
  }

  return (
    <TooltipProvider delayDuration={250}>
      <aside
        className={cn(
          "shrink-0 border-r hidden md:flex flex-col transition-[width] duration-200 sticky top-0 self-start h-screen",
          showCollapsed ? "w-16" : "w-60"
        )}
        style={{ background: "var(--vox-surface-elev)" }}
      >
        {/* Header: wordmark/marca + toggle */}
        <div
          className={cn(
            "flex items-center",
            showCollapsed ? "flex-col gap-3 px-3 pt-5 pb-4" : "justify-between px-5 pt-6 pb-2"
          )}
        >
          <Link
            href="/dashboard"
            aria-label="VOX"
            className="inline-flex shrink-0"
          >
            {showCollapsed ? (
              <VoxMark variant="forest" size={32} priority />
            ) : (
              <VoxWordmark height={26} priority />
            )}
          </Link>
          <button
            type="button"
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-accent text-vox-muted hover:text-vox-ink transition-colors"
            aria-label={showCollapsed ? "Expandir menu" : "Recolher menu"}
            title={showCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {showCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex flex-col gap-0.5 text-sm flex-1 overflow-y-auto",
            showCollapsed ? "px-2 mt-4" : "px-3 mt-6"
          )}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const linkClasses = cn(
              "flex items-center rounded-md transition-colors",
              showCollapsed
                ? "justify-center px-3 py-2.5"
                : "gap-3 px-3 py-2",
              active
                ? "bg-accent text-vox-forest font-medium"
                : "text-vox-prose hover:text-vox-ink hover:bg-accent/60"
            );
            const link = (
              <Link href={item.href} className={linkClasses}>
                <Icon className="size-4 shrink-0" />
                {!showCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
            return showCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{link}</div>
            );
          })}
        </nav>

        {/* Footer (atalho discreto) */}
        {!showCollapsed ? (
          <footer className="px-5 py-4 text-xs text-vox-muted vox-mono border-t border-border">
            <kbd
              className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] mr-1.5"
              style={{ borderColor: "var(--vox-whisper)" }}
            >
              ⌘B
            </kbd>
            buscar Bíblia
          </footer>
        ) : null}
      </aside>
    </TooltipProvider>
  );
}
