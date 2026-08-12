"use server";

// Issue 046, Atualiza perfil + preferências + módulo IA + senha.
// Cada aba de /settings tem sua própria action pra patch parcial e
// mensagens de erro localizadas.

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SLIDES_BUCKET } from "@/lib/sermons/slide-sources";

export type ActionResult = { ok: boolean; error?: string };

// === Perfil (Nome + Denominação) ===

const profileBasicSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  denomination: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional(),
});

export async function updateProfileBasicAction(
  input: z.input<typeof profileBasicSchema>
): Promise<ActionResult> {
  const parsed = profileBasicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      denomination: parsed.data.denomination ?? null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Preferências (Tradução padrão da bíblia) ===

const preferencesSchema = z.object({
  bible_version: z.enum(["ARC", "ARA", "NVI", "NAA", "NVT"]),
});

export async function updatePreferencesAction(
  input: z.input<typeof preferencesSchema>
): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ bible_version: parsed.data.bible_version })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// === IA (toggle ai_enabled) ===

const aiSchema = z.object({
  ai_enabled: z.boolean(),
});

export async function updateAISettingsAction(
  input: z.input<typeof aiSchema>
): Promise<ActionResult> {
  const parsed = aiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Gate: só pode ativar a IA quem está no plano Concílio
  if (parsed.data.ai_enabled) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.plan !== "concilio") {
      return {
        ok: false,
        error: "O assistente de IA faz parte do plano Concílio.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ai_enabled: parsed.data.ai_enabled })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Plano ===

const planSchema = z.object({
  plan: z.enum(["manuscrito", "concilio"]),
});

export async function updatePlanAction(
  input: z.input<typeof planSchema>
): Promise<ActionResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  // Manuscrito desliga a IA, Concílio liga — simetria pra evitar
  // upgrade com IA ainda desativada do estado anterior.
  const updates: { plan: string; ai_enabled: boolean } = {
    plan: parsed.data.plan,
    ai_enabled: parsed.data.plan === "concilio",
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

// === Senha ===

const passwordSchema = z
  .object({
    new_password: z.string().min(8, "Senha precisa de ao menos 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    path: ["confirm_password"],
    message: "As senhas não coincidem",
  });

export async function updatePasswordAction(
  input: z.input<typeof passwordSchema>
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// === Excluir conta (eliminação definitiva, LGPD art. 18 VI) ===

/**
 * Remove tudo que o usuário tem no bucket de slides.
 *
 * O `list` do Storage não é recursivo, então descemos a árvore
 * `{userId}/{sermonId}/[_src/]arquivo` nível a nível. Entrada sem `id` é
 * pasta; com `id` é arquivo.
 */
async function purgeUserStorage(
  service: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<string[]> {
  const bucket = service.storage.from(SLIDES_BUCKET);
  const files: string[] = [];

  async function walk(prefix: string, depth: number): Promise<void> {
    // A árvore real tem 3 níveis; o limite evita laço infinito se ela mudar.
    if (depth > 4) return;
    const { data, error } = await bucket.list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) files.push(path);
      else await walk(path, depth + 1);
    }
  }

  await walk(userId, 0);
  if (files.length > 0) {
    // `remove` aceita lotes; 100 por vez evita URL/payload grande demais.
    for (let i = 0; i < files.length; i += 100) {
      await bucket.remove(files.slice(i, i + 100));
    }
  }
  return files;
}

/**
 * Exclui a conta em definitivo: arquivos do Storage, depois o usuário no Auth.
 *
 * Apagar o usuário no Auth cascateia todo o banco: `profiles.id` referencia
 * `auth.users on delete cascade`, e sermões, séries, cursos, estudo, notas,
 * versões, registros de pregação e preferências referenciam `profiles.id`
 * também em cascade. O catálogo compartilhado de exegeses sobrevive com a
 * autoria anonimizada (`generated_by on delete set null`), que é o
 * comportamento correto: o estudo bíblico não é dado pessoal do usuário.
 *
 * A ordem importa. O Storage é varrido por prefixo de caminho, não por
 * consulta ao banco, mas fazemos isso ANTES de apagar o usuário para que uma
 * falha aqui interrompa a operação com a conta ainda íntegra, em vez de
 * deixar arquivos órfãos e sem dono.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  ) {
    return {
      ok: false,
      error:
        "Exclusão indisponível: configuração do servidor incompleta. Fale com o suporte.",
    };
  }

  const service = createServiceClient();

  try {
    await purgeUserStorage(service, user.id);
  } catch {
    return {
      ok: false,
      error:
        "Não foi possível remover seus arquivos. Nada foi excluído; tente de novo.",
    };
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      error: `Não foi possível excluir a conta (HTTP ${response.status}). Tente de novo.`,
    };
  }

  // A conta já não existe; o signOut aqui só limpa o cookie local. Se falhar,
  // a exclusão continua sendo um sucesso — o middleware derruba a sessão órfã
  // no próximo request de qualquer forma. Engolir o erro evita mostrar "falhou"
  // para uma operação que de fato aconteceu e é irreversível.
  try {
    await supabase.auth.signOut();
  } catch {
    // sessão órfã, nada a fazer
  }
  return { ok: true };
}
