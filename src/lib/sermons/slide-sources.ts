// Envio de arquivo-fonte de slides (PDF/imagem) direto do navegador para o
// Storage, sem passar pelo corpo da requisição.
//
// Por quê: uma Function da Vercel recusa corpo acima de ~4.5MB com
// 413 FUNCTION_PAYLOAD_TOO_LARGE, ANTES do handler rodar — um PDF de 5.8MB
// morria sem nem chegar no log. O navegador manda o arquivo direto pro bucket
// (que aceita até 50MB) e a rota recebe só o caminho, alguns bytes de JSON.

export const SLIDES_BUCKET = "sermon-slides";

/** Pasta dos arquivos-fonte temporários, apagados depois da conversão. */
export const SOURCE_PREFIX = "_src";

export const MAX_SOURCE_BYTES = 50 * 1024 * 1024;

// --- Formato do slide renderizado ---------------------------------------
// Compartilhado pelas duas rotas que rasterizam (upload em lote e troca de
// imagem de um slide), pra não divergirem: um slide trocado precisa ter a
// mesma nitidez dos que vieram do PDF.
//
// 2560x1440 é 2x o 1080p da projeção. O PDF é vetorial, então a largura de
// render é o que define a nitidez do texto — em 1280 as serifas serrilham
// visivelmente num projetor. Dobrar custa ~110KB por slide (era ~25KB) e
// ~300ms de render, folgado dentro do maxDuration.
export const SLIDE_WIDTH = 2560;
export const SLIDE_HEIGHT = 1440;

/** q92 é o joelho da curva: acima disso o arquivo cresce sem ganho visível.
    `effort` fica no padrão (4) — o 6 economiza 2KB e custa 35% mais tempo. */
export const SLIDE_WEBP_OPTIONS = { quality: 92 } as const;

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

export function isPdfName(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

/** Extensão normalizada do arquivo, por nome ou, na falta, pelo mime. */
export function sourceExtension(file: { name: string; type: string }): string | null {
  const lower = file.name.toLowerCase();
  const byName = ALLOWED_EXTENSIONS.find((e) => lower.endsWith(e));
  if (byName) return byName === ".jpeg" ? ".jpg" : byName;
  return EXTENSION_BY_MIME[file.type] ?? null;
}

/** Caminho no bucket. O primeiro nível é o uid, exigido pelas policies. */
export function sourcePath(
  userId: string,
  sermonId: string,
  extension: string,
  unique: string
): string {
  return `${userId}/${sermonId}/${SOURCE_PREFIX}/${unique}${extension}`;
}

/** Valida que o caminho é de fato um fonte temporário deste usuário e conteúdo. */
export function isValidSourcePath(
  path: string,
  userId: string,
  sermonId: string
): boolean {
  if (path.includes("..")) return false;
  if (!path.startsWith(`${userId}/${sermonId}/${SOURCE_PREFIX}/`)) return false;
  const lower = path.toLowerCase();
  return ALLOWED_EXTENSIONS.some((e) => lower.endsWith(e));
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

interface StorageClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> };
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        file: File,
        opts?: { contentType?: string; upsert?: boolean }
      ): Promise<{ error: { message: string } | null }>;
      remove(paths: string[]): Promise<unknown>;
    };
  };
}

/**
 * Sobe os arquivos para o bucket e devolve os caminhos, na ordem recebida.
 * Se um arquivo falhar, remove os que já subiram antes de lançar.
 */
export async function uploadSlideSources(
  supabase: StorageClient,
  sermonId: string,
  files: File[]
): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sua sessão expirou. Recarregue a página e tente de novo.");
  }

  const uploaded: string[] = [];
  const bucket = supabase.storage.from(SLIDES_BUCKET);
  try {
    for (const file of files) {
      if (file.size > MAX_SOURCE_BYTES) {
        throw new Error(`"${file.name}" passa de 50MB.`);
      }
      const extension = sourceExtension(file);
      if (!extension) {
        throw new Error(
          `"${file.name}" não é suportado. Envie PDF, PNG, JPG ou WebP.`
        );
      }
      const path = sourcePath(user.id, sermonId, extension, randomId());
      const { error } = await bucket.upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });
      if (error) {
        throw new Error(`Falha ao enviar "${file.name}": ${error.message}`);
      }
      uploaded.push(path);
    }
  } catch (err) {
    if (uploaded.length > 0) await bucket.remove(uploaded).catch(() => null);
    throw err;
  }
  return uploaded;
}
