"use client";

// Navegação mobile (<768px). Hambúrguer no canto + drawer lateral com os
// mesmos itens da AppSidebar. Estado isolado deste componente.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BookMarked,
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  Menu,
  Settings,
  Upload,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VoxWordmark } from "@/components/brand/VoxWordmark";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/sermons", label: "Esboços", icon: FileText },
  { href: "/sermons?view=arquivo", label: "Arquivados", icon: Archive },
  { href: "/bible", label: "Bíblia", icon: BookMarked },
  { href: "/courses", label: "Cursos", icon: GraduationCap },
  { href: "/study", label: "Estudo", icon: BookOpen },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    if (href === "/dashboard") return false;
    return pathname.startsWith(href + "/");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="md:hidden p-2 -ml-2 rounded-md hover:bg-accent text-vox-prose hover:text-vox-ink transition-colors"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] p-0 flex flex-col"
        style={{ background: "var(--vox-surface-elev)" }}
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              aria-label="VOX"
              onClick={() => setOpen(false)}
              className="inline-flex"
            >
              <VoxWordmark height={26} priority />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-0.5 text-sm px-3 mt-4 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  active
                    ? "bg-accent text-vox-forest font-medium"
                    : "text-vox-prose hover:text-vox-ink hover:bg-accent/60"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
