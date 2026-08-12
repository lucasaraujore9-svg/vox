# Auditoria — Observabilidade, Confiabilidade e DR
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/05-observabilidade.md · Itens do inventário cobertos: relevantes ao domínio abaixo_

## Resumo
- Itens verificados: 8 eixos (logging, error tracking, error boundaries, health check, métricas/alertas, audit log, custo de IA, DR)
- Achados: **P0=0 · P1=3 · P2=5 · P3=0**
- Nota do domínio: **3/10**
- `console.*` em `src/` (runtime de produção): **1** (`src/lib/notes/queries.ts:49`). Fora do runtime: 11 ocorrências em `scripts/load-alinhamento.mjs` (script utilitário, não roda em produção). Total no repo: 12.

Contexto positivo (não é achado, é o que existe): o fluxo de exegese (`chapter_exegeses`) mede tokens/custo e aplica cap mensal por usuário. É a única peça de observabilidade real do sistema. Todo o resto está ausente.

---

## Achados

### [OBS-001] Ausência total de error tracking (Sentry/equivalente) no client e no server
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `package.json:12-58` (dependências) · `src/app/layout.tsx:90-107` (root layout sem instrumentação) · ausência de `instrumentation.ts`/`instrumentation-client.ts` na raiz e em `src/`
- **Evidência:** grep por `sentry|bugsnag|datadog|rollbar|newrelic|honeybadger|logrocket|posthog` em `package.json` e `src/` → **NENHUMA** ocorrência. Não existe `instrumentation.ts` nem hook `onRequestError` (grep vazio). O `next.config.ts` não tem integração de erro. Erros de Server Action e Route Handler são apenas devolvidos ao cliente como string, ex.: `src/app/api/ai/suggest/route.ts:136-143` (`catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }) }`) — nada é capturado, agregado ou notificado.
- **Impacto:** Quando um pastor tem erro no domingo de manhã (upload de slide falha, geração de IA quebra, sessão expira mid-fluxo), **ninguém fica sabendo**. Você descobre o bug pelo cliente reclamando por WhatsApp — se ele reclamar. Sem release tagging nem source maps não há como correlacionar um erro a um deploy. Para um produto que se pretende vendável, é o ponto cego operacional mais grave: não há sinal de saúde da aplicação em produção.
- **Correção:**
  1. `npm i @sentry/nextjs` e rodar `npx @sentry/wizard@latest -i nextjs` (ou configurar manual).
  2. Criar `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` com `Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.VERCEL_ENV })`.
  3. Criar `src/instrumentation.ts` exportando `register()` e `onRequestError` (repassa para `Sentry.captureRequestError`).
  4. Envolver o `next.config.ts` com `withSentryConfig` para upload de source maps no build.
  5. Adicionar `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` ao `.env.example` e às env vars da Vercel.
  6. Nos `catch` que hoje engolem erro (ver OBS-004), chamar `Sentry.captureException(err)` antes de degradar.
  7. ⚠️MIGRAÇÃO Swarm: Sentry self-host (ou GlitchTip) já resolve, é agnóstico de Vercel.
- **Verificação:** disparar um erro proposital em um route handler (throw) e confirmar o evento aparecendo no dashboard do Sentry com stack trace desminificado e a tag de release/commit.

### [OBS-002] Zero error boundaries — crash em runtime deixa tela morta e não é capturado
- **Severidade:** P1
- **Status:** Aberto
- **Local:** toda a árvore `src/app/**` — `find src/app -name error.tsx -o -name global-error.tsx` retorna **vazio** (0 arquivos; confirmado no INVENTARIO.md linha 14)
- **Evidência:** Não existe nenhum `error.tsx`, `global-error.tsx`, `not-found.tsx` nem `loading.tsx` em todo o projeto. Um erro de render em qualquer segmento (ex.: `/sermons/[id]/present`, o modo de apresentação usado ao vivo no púlpito) sobe para o error boundary padrão do Next, que em produção mostra uma tela genérica "Application error" sem marca, sem botão de recuperação e sem reportar nada.
- **Impacto:** Falha operacional no pior momento: se a tela de Apresentar/Teleprompter quebra durante o sermão, o pastor fica travado numa tela de erro crua, sem "tentar novamente" e sem cair para um modo degradado. Não há captura do erro (casa com OBS-001) nem UX de recuperação. Para uma PWA cuja proposta é ser "companheiro do púlpito", um crash sem rede de segurança é altamente visível para o usuário final.
- **Correção:**
  1. Criar `src/app/global-error.tsx` (Client Component com `"use client"`) que renderiza uma tela de erro com os tokens da marca (fundo `--vox-bg`, `--vox-ink`), botão "tentar novamente" (`reset()`) e chama `Sentry.captureException(error)` no `useEffect`.
  2. Criar `src/app/(app)/error.tsx` e `src/app/(app)/sermons/[id]/present/error.tsx` (o fluxo mais crítico) com fallback específico e `reset()`.
  3. Criar `src/app/not-found.tsx` e `loading.tsx` nos segmentos com fetch pesado.
  4. Seguir o design-system (sem `#000`, sem emoji, usar `VoxIcon`).
- **Verificação:** provocar `throw new Error("boom")` num Server Component de `/sermons/[id]/present`, rodar `npm run build && npm start`, acessar a rota e confirmar que aparece a tela de erro da marca com botão de retry (e não o fallback cru do Next), e que o evento chega ao Sentry.

### [OBS-003] Gasto de IA em `/api/ai/suggest` não é medido nem limitado — custo invisível
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/api/ai/suggest/route.ts:119-135`
- **Evidência:** A rota chama `openai.responses.create(...)` (linha 122) e retorna o JSON, mas **não persiste tokens nem custo** em lugar nenhum: grep de `insert|chapter_exegeses|cost_usd|tokens` no arquivo só encontra a leitura de `profiles` (linha 66). Não há checagem do `monthly_user_cap_usd` (o cap só é aplicado no fluxo de exegese, `src/lib/exegesis/actions.ts:208-227`). O único freio é um rate-limit **em memória por processo** (`const buckets = new Map(...)`, linhas 38-54) que o próprio código admite ser insuficiente em produção (comentário linha 3: "Em prod, mover rate limit para Upstash/Redis"). Em serverless (Vercel), cada instância tem seu próprio `Map`, então o limite de 10/h se multiplica pelo número de lambdas ativas.
- **Impacto:** Todo o consumo de OpenAI do assistente de blocos (`/api/ai/suggest`) é **invisível** — não aparece no relatório de `/admin/ai` (que só lê `chapter_exegeses`), não conta para o cap mensal e não dispara alerta. Um usuário do plano Concílio (ou uma chave vazada) pode disparar sugestões em volume e **queimar o orçamento da OpenAI silenciosamente**, sem teto e sem ninguém perceber até a fatura chegar. É o furo de custo que a auditoria pediu para checar.
- **Correção:**
  1. Após a resposta da OpenAI em `/api/ai/suggest`, extrair `response.usage` (input/output tokens), calcular custo com `computeCostUsd(...)` de `src/lib/ai/client.ts` e gravar numa tabela de uso (reaproveitar/estender uma tabela tipo `ai_usage_events` com `user_id, endpoint, model, tokens_in, tokens_out, cost_usd, created_at`).
  2. Antes da chamada, aplicar o mesmo cap mensal do fluxo de exegese: somar o custo do mês do usuário (exegeses + suggests) e bloquear com 429 se `>= monthly_user_cap_usd`.
  3. Trocar o rate-limit em memória por um distribuído (Upstash Redis hoje; ⚠️MIGRAÇÃO: `ioredis`/`redis` TCP no Swarm).
  4. Incluir o consumo do suggest no relatório de `src/lib/admin/ai-queries.ts` (`listAIUsage`).
  5. Adicionar alerta quando o custo diário/mensal agregado ultrapassar um limiar (ver OBS-006).
- **Verificação:** chamar `/api/ai/suggest` autenticado, confirmar novo registro de uso com tokens/custo > 0, e que após atingir `monthly_user_cap_usd` a rota responde 429. Conferir que o valor aparece somado em `/admin/ai`.

### [OBS-004] Sem logging estruturado; erros engolidos em `catch {}` vazios (silent failure)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/lib/notes/queries.ts:49` (único `console.error`) + `catch {}` silenciosos em: `src/app/api/sermons/slides/[slideId]/route.ts:153`, `src/app/api/series-and-courses/route.ts:57`, `src/lib/sermons/slides.ts:70`, `src/lib/admin/queries.ts:108,172`, `src/lib/admin/ai-queries.ts:136`, `src/lib/admin/users.ts:214`, `src/lib/exegesis/actions.ts:115`, `src/lib/interests/actions.ts:111`, `src/lib/presenter/theme.ts:27,55`, `src/lib/presenter/channel.ts:34`, `src/lib/frameworks/hints.ts:118,127`
- **Evidência:** O sistema inteiro (202 arquivos `.ts`/`.tsx`) tem **um único** `console.error` (`src/lib/notes/queries.ts:49: console.error("listNotes error", error)`), que apenas imprime no stdout da Vercel sem estrutura, sem request id, sem user id. Não há logger estruturado (grep por `pino|winston|createLogger|logger` → nada). Em paralelo, há 14+ blocos `catch {}` que descartam a exceção por completo — ex.: `src/lib/admin/users.ts:200-217` (falha no logout global ao desativar usuário é silenciada), `src/lib/exegesis/actions.ts:115`, `src/app/api/sermons/slides/[slideId]/route.ts:153` (falha ao remover slide). Erros somem sem rastro.
- **Impacto:** Não há como diagnosticar incidentes em produção. Falhas silenciadas (logout que não aconteceu, slide que não foi apagado, custo de exegese não atualizado) não deixam nenhum sinal — nem log, nem métrica, nem exceção capturada. Debug vira adivinhação. `console.error` solto na Vercel também não tem retenção nem busca decente e some na migração para Swarm.
- **Correção:**
  1. Introduzir um logger estruturado (`pino`) em `src/lib/log.ts` emitindo JSON com `level`, `time`, `requestId`, `userId`, `route`.
  2. Gerar/propagar um `requestId` (header `x-request-id` no middleware) e injetar no logger por request.
  3. Substituir o `console.error` de `notes/queries.ts:49` por `logger.error({ err }, "listNotes falhou")`.
  4. Em cada `catch {}` silencioso, no mínimo `logger.warn`/`logger.error` com contexto + `Sentry.captureException` (OBS-001). Não deixar `catch` totalmente vazio em caminho de escrita.
  5. ⚠️MIGRAÇÃO: apontar o stdout JSON para Loki/Grafana (ou stack equivalente) com retenção definida.
- **Verificação:** rodar uma ação que passa por um `catch` (ex.: desativar usuário com Admin API indisponível) e confirmar log JSON com `requestId`/`userId` e evento no Sentry, em vez do silêncio atual.

### [OBS-005] Sem endpoint `/api/health` — bloqueia healthcheck de container e uptime monitor
- **Severidade:** P2
- **Status:** Aberto
- **Local:** ausência em `src/app/api/**` (`find src/app -ipath "*health*"` → vazio; 14 route handlers listados, nenhum de health)
- **Evidência:** Não existe rota `/api/health`, `/api/ready` ou equivalente. Nenhum dos 14 route handlers faz liveness/readiness. Grep por `health|readiness|liveness` em `src/` e `next.config.ts` → vazio.
- **Impacto:** Não há como um monitor externo (Uptime Kuma etc.) verificar se o app está de pé, nem checar se DB/Storage estão acessíveis. ⚠️MIGRAÇÃO: no Docker Swarm + Traefik, sem `HEALTHCHECK` o rolling update sobe container quebrado sem detectar, e o Traefik roteia tráfego para instância morta. Hoje, na Vercel, também não há alvo para alerta de indisponibilidade.
- **Correção:**
  1. Criar `src/app/api/health/route.ts` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`) que faz um check raso (200 `{ status: "ok" }`) e um check "profundo" opcional (`?deep=1`) que executa um `select 1` no Supabase e um ping no Redis (quando existir), retornando 503 se algum falhar.
  2. Não exigir auth nesta rota; adicionar `/api/health` ao `isPublicPath` do middleware (`src/middleware.ts:11-15`).
  3. ⚠️MIGRAÇÃO: usar como `HEALTHCHECK CMD curl -f http://localhost:3000/api/health` no Dockerfile e como health do serviço no Swarm.
- **Verificação:** `curl -f http://localhost:3000/api/health` → 200; com DB desligado, `curl http://localhost:3000/api/health?deep=1` → 503.

### [OBS-006] Sem métricas, analytics ou alertas (latência, taxa de erro, throughput, custo)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `package.json:12-58` · `src/app/layout.tsx:90-107`
- **Evidência:** Nenhuma dependência de analytics/métrica (`@vercel/analytics`, `@vercel/speed-insights`, `posthog`, `plausible`, `opentelemetry` → grep vazio). O root layout não monta nenhum componente de analytics. Não há coleta de métrica de negócio (sermões criados, usuários ativos, gerações de IA/dia) nem técnica (p95 de latência por endpoint, taxa de erro). Não há nenhum alerta configurável no código.
- **Impacto:** Cegueira sobre saúde e uso do produto. "Está lento" não tem onde ser investigado (sem tracing/latência por endpoint — os handlers de slides têm `maxDuration` de 60/300s, exatamente onde métricas importariam). Nenhum alerta de pico de erro, de latência ou de custo (casa com OBS-003). Para decisão de produto e para operar um SaaS vendável, não há dado.
- **Correção:**
  1. Métrica técnica mínima: habilitar Vercel Analytics + Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`) no root layout, ou instrumentar OpenTelemetry via `instrumentation.ts` exportando spans para um coletor.
  2. Métrica de negócio: eventos-chave (sermão criado, IA usada, custo) para PostHog/Plausible (self-host na migração) ou tabela própria agregada.
  3. Alertas acionáveis: configurar no Sentry (taxa de erro), e um job diário que soma custo de IA e notifica (e-mail/Telegram) ao ultrapassar limiar.
  4. ⚠️MIGRAÇÃO: Prometheus + Grafana no Swarm; endpoint `/api/metrics` exposto internamente.
- **Verificação:** gerar tráfego e confirmar dashboards de latência/erro populados e um alerta de teste disparando ao forçar taxa de erro > limiar.

### [OBS-007] Ações administrativas sensíveis não geram audit log (quem/o quê/quando)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/lib/admin/users.ts` — `updateUserRoleAction:114-141`, `updateUserPlanAction:143-175`, `setUserActiveAction:177-222`, `deleteUserAction:224-256`, `createUserAction:46-112`; `src/lib/admin/ai.ts:23-58`
- **Evidência:** Todas as mutações administrativas escrevem direto em `profiles`/Auth Admin API e chamam `revalidatePath`, mas **nenhuma grava um registro de auditoria**. Ex.: `deleteUserAction` (linha 239) apaga o usuário via Admin API e retorna, sem trilha; `updateUserRoleAction` (linha 133) muda o papel sem registrar quem promoveu quem; `setUserActiveAction` (linha 193) desativa sem log. Nas 32 migrations não há tabela de auditoria (grep `audit|activity_log|event_log` → só um comentário em `026_chapter_exegeses.sql:39`). O único "quem gerou" registrado é `generated_by`/`updated_by` de IA, não das ações de admin.
- **Impacto:** Viola o guardrail explícito do projeto ("operações sensíveis — exclusão, alteração de permissão, billing — registram quem/o quê/quando", CLAUDE.md global). Sem trilha, é impossível responder "quem rebaixou/excluiu o usuário X" ou "quem mudou o plano/cap de IA", inviabilizando forense de incidente e conformidade — problema real para um SaaS multi-tenant vendável.
- **Correção:**
  1. Criar migration `033_admin_audit_log.sql` com tabela `admin_audit_log (id, actor_id, action, target_type, target_id, metadata jsonb, created_at)`, RLS permitindo leitura só a admin/super_admin e escrita só via service_role.
  2. Num helper `src/lib/admin/audit.ts`, inserir um registro ao fim de cada action de `users.ts` e `ai.ts` (action = `user.role_changed`, `user.deactivated`, `user.deleted`, `user.plan_changed`, `ai.settings_updated`), com `actor_id` = usuário autenticado e `metadata` = valores antes/depois.
  3. Expor uma leitura em `/admin` (opcional) para consulta da trilha.
- **Verificação:** desativar um usuário e mudar um papel; confirmar duas linhas em `admin_audit_log` com `actor_id`, `target_id`, `action` e timestamp corretos.

### [OBS-008] Sem plano de DR — RTO/RPO indefinidos, sem runbook, restore não testado
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `docs/` (SPEC, architecture, design-system, stitch-prompts, workflow) e raiz do repo — nenhum artefato de DR/backup
- **Evidência:** grep por `backup|restore|rto|rpo|runbook|disaster|recovery|pg_dump|pitr` em `.md/.sql/.sh/.ts/.mjs` (excluindo node_modules) → só falsos positivos (texto de sermão em `scripts/load-alinhamento.mjs` e a palavra "corpo"). `DEPLOY_NOTES.md` documenta a trilha de deploy e chaves, mas **nada** sobre backup do Postgres/Storage, RTO/RPO ou rollback. Não há script de `pg_dump`, nem runbook de incidente (banco fora, integração caída, deploy ruim).
- **Impacto:** Sem RTO/RPO por escrito, ninguém sabe quanto dado (sermões, exegeses) pode ser perdido nem em quanto tempo o serviço volta. Sem restore testado, o backup automático do Supabase pode nunca ter sido validado — descobrir que o backup não restaura durante um desastre real é o pior cenário. Sem runbook, cada incidente vira improviso. ⚠️MIGRAÇÃO para VPS self-host: a responsabilidade de backup passa a ser 100% sua, e a ausência de procedimento vira risco de perda total.
- **Correção:**
  1. Escrever `docs/DR.md` com RTO e RPO por escrito (ex.: RTO 4h, RPO 24h) e o inventário do que precisa de backup (Postgres, bucket `sermon-slides`).
  2. Documentar/automatizar backup: enquanto na Vercel/Supabase, confirmar PITR/daily backups habilitados no dashboard e registrar a retenção; adicionar `scripts/backup-db.sh` (`pg_dump`) e `scripts/backup-storage.sh` para a fase self-host.
  3. Fazer e documentar um **restore drill** (restaurar um dump num banco descartável e validar contagens).
  4. Escrever runbooks em `docs/runbooks/` para: banco fora, Storage/IA/Bible caídos, deploy ruim → rollback.
- **Verificação:** existência de `docs/DR.md` com RTO/RPO e de ao menos um runbook; log de um restore drill executado com sucesso (data + contagem de linhas conferida).

---

## Cobertura

### A — Logging (`console.*` em todo `src/`, sem amostragem)
| Item | Veredito |
|---|---|
| `src/lib/notes/queries.ts:49` (`console.error`) | Achado OBS-004 (único log do runtime; sem estrutura) |
| Demais 201 arquivos `.ts`/`.tsx` de `src/` | OK — sem `console.*` (nenhum `console.log` de produção; bom) — porém sem logger estruturado → OBS-004 |
| `scripts/load-alinhamento.mjs` (11 `console.*`) | N/A — script utilitário one-off, não roda em runtime de produção |
| PII em log (email/nome/telefone/sermão) | N/A — sem evidência: o único log despeja objeto de erro do Supabase, não dados de usuário |
| Segredo/token em log | N/A — sem evidência de segredo logado |

### B — Error tracking
| Item | Veredito |
|---|---|
| Sentry/Bugsnag/Datadog/Rollbar em `package.json` e `src/` | Achado OBS-001 (ausente) |
| `instrumentation.ts` / `onRequestError` | Achado OBS-001 (ausente) |
| Tratamento de erro em route handlers (14) e actions (16 módulos `"use server"`) | Achado OBS-001 + OBS-004 (erro devolvido como string ou engolido, nunca capturado) |

### C — Error boundaries
| Item | Veredito |
|---|---|
| `error.tsx` / `global-error.tsx` / `not-found.tsx` / `loading.tsx` (toda a árvore `src/app`) | Achado OBS-002 (0 arquivos — confirmado) |

### D — Health check
| Item | Veredito |
|---|---|
| `/api/health` ou equivalente | Achado OBS-005 (ausente) |
| `src/middleware.ts` (público p/ health) | Relacionado a OBS-005 (health precisaria entrar em `isPublicPath`) |

### E — Métricas e alertas
| Item | Veredito |
|---|---|
| Vercel Analytics / Speed Insights / PostHog / Plausible | Achado OBS-006 (ausente) |
| Métrica de negócio / técnica / tracing (OTel) | Achado OBS-006 (ausente) |
| Alertas (erro/latência/custo) | Achado OBS-006 (ausente) |

### F — Audit log de ações sensíveis
| Item | Veredito |
|---|---|
| `src/lib/admin/users.ts` (create/updateRole/updatePlan/setActive/delete) | Achado OBS-007 (nenhum registro de auditoria) |
| `src/lib/admin/ai.ts` (updateAdminAISettings) | Achado OBS-007 (só grava `updated_by` no registro alterado, sem trilha histórica) |
| Migrations 013/027/029 + demais (tabela de auditoria) | Achado OBS-007 (nenhuma tabela `*_audit_log`) |

### G — Custo de IA
| Item | Veredito |
|---|---|
| `chapter_exegeses` (tokens_in/out, cost_usd) + cap em `exegesis/actions.ts:208-227` | OK (parcial) — custo medido e cap aplicado no fluxo de exegese |
| `/api/ai/suggest` (assistente de blocos) | Achado OBS-003 (chama OpenAI sem medir tokens/custo e sem aplicar cap) |
| Relatório `/admin/ai` (`ai-queries.ts:listAIUsage`) | Achado OBS-003 (só agrega `chapter_exegeses`; ignora suggest) |
| Rate-limit `/api/ai/suggest` (in-memory) | Achado OBS-003 (per-process, ineficaz em serverless) |
| Alerta de estouro de orçamento | Achado OBS-006 (inexistente) |

### H — DR / backup
| Item | Veredito |
|---|---|
| RTO/RPO por escrito | Achado OBS-008 (ausente) |
| Script/procedimento de backup (Postgres/Storage) | Achado OBS-008 (ausente) |
| Restore testado / runbooks | Achado OBS-008 (ausente) |
| `DEPLOY_NOTES.md` | OK como trilha de deploy, mas N/A para DR (não cobre backup/restore/rollback) |
