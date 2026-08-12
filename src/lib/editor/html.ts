// Utilitários para lidar com o HTML produzido pelo TipTap em contextos onde
// precisamos renderizar (apresentação) ou extrair texto puro (exports, previews).

/** Detecta se uma string contém HTML (não apenas texto solto). */
export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  return /<[a-z][^>]*>/i.test(content);
}

/** Converte HTML simples do TipTap em texto puro, preservando quebras. */
export function stripHtml(html: string): string {
  if (!html) return "";
  if (!isHtmlContent(html)) return html;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(h[1-6]|div|li|blockquote)>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Trecho de preview: strip HTML e corta no `max`. Adiciona "…" se cortado. */
export function previewSnippet(content: string, max = 80): string {
  const plain = stripHtml(content).replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trimEnd() + "…";
}

/**
 * Sanitização mínima para `dangerouslySetInnerHTML`. Permite só a whitelist de
 * tags geradas pelo TipTap. Remove <script>, <iframe>, on*-handlers e
 * javascript: em hrefs. Suficiente para conteúdo escrito pelo próprio dono
 * sob RLS, não é defesa contra atacante criando conteúdo cross-account.
 */
export function safeHtml(html: string): string {
  if (!html) return "";
  if (!isHtmlContent(html)) {
    // Texto puro com possíveis newlines, preserva como parágrafos.
    return html
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  // Remove scripts/iframes/styles inteiros
  let safe = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  // Remove atributos perigosos
  safe = safe.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  safe = safe.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  // Remove javascript: em href/src
  safe = safe.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, "$1=\"#\"");
  safe = safe.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
  return safe;
}

/**
 * Remove cor e marca-texto inline do HTML do TipTap.
 *
 * O editor grava `style="color: …"` com cores escolhidas sobre o Parchment.
 * Levadas para o fundo escuro, viram texto escuro sobre escuro — some. Em modo
 * noturno a superfície decide a cor; o resto da formatação (negrito, itálico,
 * listas) fica intacto.
 */
export function withoutInlineColors(html: string): string {
  if (!html) return html;
  return html.replace(/style\s*=\s*"([^"]*)"/gi, (full, css: string) => {
    const kept = css
      .split(";")
      .filter((decl) => {
        const prop = decl.split(":")[0]?.trim().toLowerCase() ?? "";
        return prop !== "color" && prop !== "background-color" && prop !== "background";
      })
      .join(";")
      .trim();
    return kept ? `style="${kept}"` : "";
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
