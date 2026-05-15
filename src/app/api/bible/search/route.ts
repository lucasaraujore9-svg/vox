// GET /api/bible/search?version=&q=
// Busca por palavra na versão escolhida. Sem cache no edge (busca pode ter ranking variável).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { BibleApiError, searchVerses } from "@/lib/bible/client";
import { DEFAULT_VERSION } from "@/lib/bible/versions";

export const runtime = "nodejs";

const schema = z.object({
  version: z.string().min(2).max(20).default(DEFAULT_VERSION),
  q: z.string().trim().min(2).max(100),
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const parsed = schema.safeParse({
    version: url.searchParams.get("version") ?? undefined,
    q: url.searchParams.get("q"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await searchVerses(parsed.data.version, parsed.data.q);
    return NextResponse.json(result);
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
