// Serve o modelo de importação VOX como .txt para download direto.
// Não requer auth: o conteúdo é estático e só depende dos tipos de bloco.

import { NextResponse } from "next/server";
import { buildImportTemplate, TEMPLATE_FILENAME } from "@/lib/import/template";

export const runtime = "nodejs";

export function GET() {
  return new NextResponse(buildImportTemplate(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
