// GET /api/bible/random?version=
// Versículo aleatório. Cache: 12h pra não bater na API a cada page load do dashboard.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BibleApiError, fetchRandomVerse } from "@/lib/bible/client";
import { DEFAULT_VERSION } from "@/lib/bible/versions";

export const runtime = "nodejs";

const schema = z.object({
  version: z.string().min(2).max(20).default(DEFAULT_VERSION),
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const parsed = schema.safeParse({
    version: url.searchParams.get("version") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }
  try {
    const verse = await fetchRandomVerse(parsed.data.version);
    return NextResponse.json(verse, {
      headers: {
        "Cache-Control": "public, max-age=43200, s-maxage=43200",
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
