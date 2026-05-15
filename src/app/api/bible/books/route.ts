// GET /api/bible/books → lista canônica (servido do catálogo local; mais rápido que API)

import { NextResponse } from "next/server";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(BIBLE_BOOKS, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
