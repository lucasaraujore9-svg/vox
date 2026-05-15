"use client";

// Dropdown compacto pra pular pra qualquer capítulo do livro corrente.

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { BookInfo } from "@/lib/bible/books";
import type { BibleVersionId } from "@/lib/bible/versions";

export function BibleChapterNav({
  book,
  current,
  version,
}: {
  book: BookInfo;
  current: number;
  version: BibleVersionId;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Capítulo {current} ▾
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="grid grid-cols-6 gap-1 p-2 w-72 max-h-80 overflow-y-auto"
      >
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
          <DropdownMenuItem
            key={n}
            asChild
            className="justify-center vox-mono text-xs cursor-pointer"
          >
            <Link
              href={`/bible?book=${book.abbrev}&chapter=${n}&version=${version}`}
              style={
                n === current
                  ? { background: "var(--vox-forest-soft)", color: "var(--vox-forest)" }
                  : undefined
              }
            >
              {String(n).padStart(2, "0")}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
