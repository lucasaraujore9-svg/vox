// Issue 035/051, Assistente de IA.
// Sempre verifica `profile.ai_enabled`. Rate limit simples por usuário (10/h em memória).
// Em prod, mover rate limit para Upstash/Redis ou Supabase Edge Function.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOpenAI, loadAISettings } from "@/lib/ai/client";
import { SUGGEST_SYSTEM_PROMPTS } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  framework: z.enum([
    "expositivo",
    "textual",
    "narrativo",
    "tematico",
    "topico",
    "livre",
  ]),
  topic: z.string().trim().min(3).max(500),
  bibleRef: z.string().trim().optional(),
  existingBlocks: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

// Rate-limit in-memory (per process, best-effort)
const buckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function checkRate(userId: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_enabled")
    .eq("id", user.id)
    .maybeSingle<{ ai_enabled: boolean }>();
  if (!profile?.ai_enabled) {
    return NextResponse.json(
      { error: "Módulo de IA desativado. Ative em /settings." },
      { status: 403 }
    );
  }

  const rate = checkRate(user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Limite atingido, tente novamente em ${rate.retryAfter}s.`,
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corpo inválido", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { framework, topic, bibleRef, existingBlocks } = parsed.data;
  const system = SUGGEST_SYSTEM_PROMPTS[framework];

  const userPrompt = [
    `Tema/texto: ${topic}`,
    bibleRef ? `Referência bíblica: ${bibleRef}` : null,
    existingBlocks?.length
      ? `Blocos já escritos (não duplique):\n${existingBlocks
        .map((b, i) => `${i + 1}. [${b.type}] ${b.title}: ${b.content.slice(0, 200)}`)
        .join("\n")}`
      : null,
    "",
    "Devolva 5 a 8 blocos sugeridos no formato JSON especificado.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const settings = await loadAISettings();
    const openai = getOpenAI();
    const response = await openai.responses.create({
      model: settings.active_model,
      instructions: system,
      input: userPrompt,
      text: { format: { type: "json_object" } },
      temperature: 0.7,
    });

    const content = response.output_text;
    if (!content) {
      return NextResponse.json({ error: "Resposta vazia" }, { status: 502 });
    }
    const parsedJson = JSON.parse(content);
    return NextResponse.json(parsedJson);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro ao chamar OpenAI",
      },
      { status: 500 }
    );
  }
}
