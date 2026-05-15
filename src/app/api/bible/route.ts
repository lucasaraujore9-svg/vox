// GET /api/bible?version=&reference=
// Resolve uma referência (string) num conjunto de versículos.
// Aceita: "Romanos 5:1", "Rom 5:1—11", "Sl 23", "1Co 13:4-7", etc.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  BibleApiError,
  fetchChapter,
  fetchRange,
  fetchVerse,
} from "@/lib/bible/client";
import { findFirstReference } from "@/lib/bible/parser";
import { DEFAULT_VERSION } from "@/lib/bible/versions";

export const runtime = "nodejs";

const querySchema = z.object({
  version: z.string().min(2).max(20).default(DEFAULT_VERSION),
  reference: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const parsed = querySchema.safeParse({
    version: url.searchParams.get("version") ?? undefined,
    reference: url.searchParams.get("reference"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { version, reference } = parsed.data;

  const ref = findFirstReference(reference);
  if (!ref) {
    return NextResponse.json(
      { error: `Referência não reconhecida: "${reference}"` },
      { status: 422 }
    );
  }

  try {
    let verses;
    if (ref.verseStart && ref.verseEnd && ref.verseEnd > ref.verseStart) {
      verses = await fetchRange(version, ref.book.abbrev, ref.chapter, ref.verseStart, ref.verseEnd);
    } else if (ref.verseStart) {
      const v = await fetchVerse(version, ref.book.abbrev, ref.chapter, ref.verseStart);
      verses = [v];
    } else {
      const chapter = await fetchChapter(version, ref.book.abbrev, ref.chapter);
      verses = chapter.verses.map((v) => ({
        book: chapter.book,
        chapter: chapter.chapter.number,
        number: v.number,
        text: v.text,
      }));
    }

    return NextResponse.json(
      {
        canonical: ref.canonical,
        book: ref.book,
        chapter: ref.chapter,
        verseStart: ref.verseStart,
        verseEnd: ref.verseEnd,
        version,
        verses,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
        },
      }
    );
  } catch (err) {
    if (err instanceof BibleApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
