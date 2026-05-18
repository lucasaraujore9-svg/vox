// Singleton da OpenAI. Issue 051, usar SOMENTE em Route Handlers / Server Actions.
// Verificação de `profile.ai_enabled` deve preceder cada chamada.

import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!cached) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurado");
    }
    cached = new OpenAI({ apiKey });
  }
  return cached;
}

export const AI_MODEL = "gpt-4o";
