// GET /api/bible/chapter?version=&book=&chapter=
// Capítulo inteiro pro leitor /bible.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BibleApiError, fetchChapter } from "@/lib/bible/client";
import { DEFAULT_VERSION } from "@/lib/bible/versions";

export const runtime = "nodejs";

const schema = z.object({
  version: z.string().min(2).max(20).default(DEFAULT_VERSION),
  book: z.string().min(1).max(10),
  chapter: z.coerce.number().int().min(1).max(150),
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const parsed = schema.safeParse({
    version: url.searchParams.get("version") ?? undefined,
    book: url.searchParams.get("book"),
    chapter: url.searchParams.get("chapter"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await fetchChapter(parsed.data.version, parsed.data.book, parsed.data.chapter);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      },
    });
  } catch (err) {
    if (err instanceof BibleApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
