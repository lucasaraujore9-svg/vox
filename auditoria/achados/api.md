# Auditoria — API e Integrações
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/07-api-integracoes.md · Itens do inventário cobertos: 14/14 route handlers_

## Resumo
- Itens verificados: 14 route handlers + clients (bible, ai) + slide-sources + admin/ai · Achados: P0=0 P1=2 P2=4 P3=5 · Nota do domínio: 6/10

## Achados

### [API-001] `/api/ai/suggest` chama a OpenAI sem cap de custo e sem registrar uso; rate limit é in-memory best-effort
- **Severidade:** P1
- **Status:** Aberto
- **Local:** src/app/api/ai/suggest/route.ts:37-54 (rate limit em Map de processo), :119-135 (chama OpenAI e devolve sem gravar tokens/custo), :26-35 (`existingBlocks` array sem `.max()`); contraste com src/lib/exegesis/actions.ts:209-227 (cap mensal aplicado) e src/lib/admin/ai-queries.ts:56-63 (relatório de uso lê só `chapter_exegeses`, nunca o suggest).
- **Evidência:** O rate limit é `const buckets = new Map<string,...>()` no escopo do módulo — o próprio comentário admite "Rate-limit in-memory (per process, best-effort)" e "Em prod, mover rate limit para Upstash/Redis". Em serverless cada instância quente tem seu próprio Map e cada cold start zera; um mesmo usuário atinge 10/h *por instância*. Após a chamada (`openai.responses.create`) o handler faz `JSON.parse(content)` e retorna, sem gravar `tokens_in/out` nem `cost_usd` em lugar nenhum. O `monthly_user_cap_usd` (default US$5) que a exegese respeita NÃO é lido aqui. `existingBlocks: z.array(...).optional()` (linha 26-34) não tem `.max()` e os campos internos `type/title/content` são `z.string()` sem limite — o cliente pode mandar milhares de blocos e inflar o prompt/custo (o handler só corta `content` a 200 chars na montagem do prompt, linha 110, mas a contagem de blocos é ilimitada).
- **Impacto:** Endpoint que fatura na OpenAI, autenticado (plano concílio + ai_enabled), sem teto de gasto confiável e invisível no painel de custo do admin (`listAIUsage` só enxerga exegeses). Um usuário concílio pode ultrapassar 10/h (limite reseta/particiona por instância) e gastar de forma aberta; o gasto não aparece em nenhum relatório. É exatamente o "conta de custo aberta / abuso financeiro" da referência §rate-limiting. Agravante: a rota é órfã (nenhum consumidor no front — `grep` por `api/ai/suggest` em src/ não retorna nada), ou seja, é superfície de ataque sem uso de produto e sem monitoramento.
- **Correção:**
  1. Aplicar o mesmo cap mensal da exegese ANTES de chamar a OpenAI: ler soma de `cost_usd` do mês por usuário e retornar 429/403 se `>= settings.monthly_user_cap_usd` (copiar o bloco de src/lib/exegesis/actions.ts:209-227).
  2. Após a resposta, gravar uso (modelo, `response.usage.input_tokens/output_tokens`, `computeCostUsd(...)`) numa tabela de uso (reaproveitar padrão de `chapter_exegeses` ou criar `ai_suggest_usage`) para o cap e o relatório funcionarem.
  3. Trocar o rate limit in-memory por um durável compartilhado (Upstash/Redis via `@upstash/redis`; na migração VPS, `ioredis`) chaveado por `user.id`.
  4. Limitar `existingBlocks`: `.array(...).max(30)` e `content: z.string().max(2000)`.
  5. Se a rota não é usada pelo produto, considerar removê-la (dead code = superfície de ataque). Se for reativada no editor, ligá-la ao mesmo controle.
- **Verificação:** Autenticar como usuário concílio e disparar N>cap chamadas seguidas (`curl -XPOST /api/ai/suggest`): a partir do cap deve vir 429/403 com mensagem de limite; conferir que cada chamada bem-sucedida gera linha de uso e aparece no `/admin/ai`. Confirmar que dois processos/instâncias distintos compartilham o mesmo contador (Redis).

### [API-002] Nenhuma chamada externa (API bíblica e OpenAI) tem timeout; UI e handler penduram se o upstream demora
- **Severidade:** P1
- **Status:** Aberto
- **Local:** src/lib/bible/client.ts:53-89 (`fetch` sem `signal`/`AbortSignal.timeout` em `get`/`post`); src/lib/ai/client.ts:9-18 (`new OpenAI({ apiKey })` sem `timeout`); rotas bíblicas sem `maxDuration` (src/app/api/bible/*/route.ts). Grep `AbortSignal|signal:|timeout` em src/lib/bible, src/lib/ai, src/app/api → nenhum. Grep `AbortSignal.timeout` em src/ → 0.
- **Evidência:** `const response = await fetch(url, { headers, next: ... })` — sem `signal`. Os `AbortController` do front (VerseOfTheDay, useBibleReference) só abortam no unmount/troca de dependência, não por tempo. O SDK OpenAI usa default de ~10 min. As rotas `/api/bible*` não declaram `maxDuration`.
- **Impacto:** Se abibliadigital.com.br ou a OpenAI travar/responder em 60s, o handler fica pendurado até o platform-timeout e o cliente roda o spinner indefinidamente (sem timeout no fetch do browser). Na Vercel o platform-timeout mata a função; na migração-alvo (Docker Swarm + Traefik, sem `maxDuration`) um upstream lento pendura o handler Node e esgota o pool de conexões — degradação graciosa inexistente (referência §3: timeout em toda chamada externa = P1).
- **Correção:**
  1. Em `bible/client.ts`, adicionar `signal: AbortSignal.timeout(8000)` (ou `AbortSignal.any([...])`) em `get` e `post`; mapear `TimeoutError`/`AbortError` para um `BibleApiError(504, "Serviço bíblico indisponível")`.
  2. Em `ai/client.ts`, `new OpenAI({ apiKey, timeout: 25_000, maxRetries: 0 })` (respeitando `maxDuration=30`).
  3. Nas rotas bíblicas, declarar `export const maxDuration = 15`.
  4. Nos consumidores de front, usar `AbortSignal.timeout(...)` e exibir estado de erro/retry.
- **Verificação:** Apontar `BIBLE_API_URL` para um endpoint que segura a resposta (ex.: servidor de teste com sleep) e confirmar que a rota responde 504 em ~8s em vez de pendurar; idem simulando lentidão da OpenAI (a rota deve estourar antes dos 30s com erro claro).

### [API-003] Respostas de erro vazam detalhe interno/upstream ao cliente e não têm envelope padrão
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/bible/client.ts:62-67 e :82-88 (`BibleApiError` embute `await response.text()` do upstream na `message`), devolvida ao cliente em src/app/api/bible/route.ts:79-85, chapter/route.ts:38-45, random/route.ts:30-37, search/route.ts:32-40; src/app/api/ai/suggest/route.ts:136-143 (`err.message` da OpenAI); src/app/api/sermons/import/route.ts:111-116 e slides/*/route.ts (retornam `error.message` cru do Supabase).
- **Evidência:** `throw new BibleApiError(response.status, \`Bible API ${response.status}: ${await response.text()...}\`)` — o corpo bruto do upstream vai para o JSON de resposta. Rotas de slides/import devolvem `deleteError.message`, `insertError.message`, `error.message` do PostgREST diretamente.
- **Impacto:** Exposição de mensagens internas (schema/policy do Postgres, corpo de erro do provedor externo) ao cliente; ajuda enumeração/recon e viola a referência §1 ("sem vazar stack/segredo na resposta"). Sem envelope `{ error: { code, message } }` padronizado dificulta o front tratar erros de forma consistente.
- **Correção:** Introduzir um helper `apiError(code, message, status)` que devolve `{ error: { code, message } }` com mensagem genérica ao cliente e faz `console.error(detalheInterno)` só no servidor. Substituir todos os `NextResponse.json({ error: err.message })` por mensagens seguras (ex.: "Falha ao salvar", "Serviço bíblico indisponível") mantendo o log server-side.
- **Verificação:** Forçar erro de banco (ex.: violar constraint) e confirmar que a resposta HTTP não contém texto de Postgres/PostgREST; conferir que o detalhe aparece só no log do servidor.

### [API-004] Sem retry/backoff, sem circuit breaker e sem validação Zod da resposta externa
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/bible/client.ts:53-89 (cast `as T`, sem retry/backoff, sem honrar 429/Retry-After); src/app/api/ai/suggest/route.ts:130-135 (`JSON.parse(response.output_text)` devolvido ao cliente sem schema).
- **Evidência:** `return (await response.json()) as T;` — nenhuma validação de formato do que vem de abibliadigital. `const parsedJson = JSON.parse(content); return NextResponse.json(parsedJson);` — o JSON do modelo é repassado cru; se a OpenAI devolver formato inesperado, o cliente recebe lixo confiando ser "blocos".
- **Impacto:** Falha transitória (5xx/429) do upstream não é reintentada (referência §3: retry com backoff + jitter, respeitar Retry-After); um upstream instável derruba a feature em vez de degradar; resposta malformada do externo propaga para a UI sem barreira (referência §1: validar request e response com Zod).
- **Correção:**
  1. Envolver `get`/`post` bíblicos com retry exponencial + jitter (2-3 tentativas) para 429/5xx, honrando `Retry-After`.
  2. Validar respostas externas com Zod (`BibleChapterSchema`, `BibleVerseSchema`, e um schema dos blocos sugeridos) antes de devolver; em parse-fail → 502 com mensagem genérica.
  3. Circuit breaker simples (contador de falhas por janela) para curto-circuitar chamadas quando o provedor está fora.
- **Verificação:** Simular 429 do upstream e confirmar reintento com espera; devolver JSON fora do schema e confirmar 502 em vez de repasse ao cliente.

### [API-005] Upload de slides sem guarda de tamanho/páginas no servidor e sem verificação de MIME por conteúdo (magic bytes)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** src/lib/sermons/slide-sources.ts:48-57 (`isValidSourcePath` valida só a extensão), :100 (`MAX_SOURCE_BYTES` checado apenas no helper client-side `uploadSlideSources`); src/app/api/sermons/slides/upload/route.ts:198-211 (baixa o blob do Storage e converte sem re-checar tamanho nem limitar nº de páginas do PDF); bodySchema :31-33 aceita até 20 sources.
- **Evidência:** O arquivo NÃO passa pelo corpo — o browser sobe direto ao Storage e o servidor recebe só o path; o único limite de 50MB está em `uploadSlideSources` (client). No handler, `storage.download(source)` → `pdfToWebpBuffers(bytes)` roda `for pageNum <= doc.numPages` sem teto de páginas. A validação de tipo é por extensão do path (`isValidSourcePath`) / nome/mime (`sourceExtension`), nunca por magic bytes.
- **Impacto:** Um usuário com escrita no próprio prefixo do bucket (RLS permite) pode subir direto um PDF gigante / com milhares de páginas e chamar a rota com esse path; o servidor baixa e renderiza tudo em memória (sharp + canvas) por até `maxDuration=300` → exaustão de memória/CPU e custo (DoS de recurso). Extensão/MIME forjados só são barrados porque o sharp/pdfjs falha depois (validação implícita frágil).
- **Correção:**
  1. No handler, após `storage.download`, checar `blob.size <= MAX_SOURCE_BYTES` antes de processar; rejeitar com 413.
  2. Limitar páginas do PDF (ex.: `if (doc.numPages > 100) throw`) e o total de slides gerados.
  3. Verificar magic bytes do buffer baixado (PDF `%PDF`, PNG `\x89PNG`, JPEG `\xFF\xD8`, WebP `RIFF....WEBP`) antes de converter, em vez de confiar em extensão.
  4. Garantir limite de tamanho também na config do bucket no Supabase.
- **Verificação:** Subir manualmente ao Storage um PDF de 40MB/500 páginas e chamar a rota — deve retornar 413/422 rápido; enviar um `.png` cujo conteúdo é PDF e confirmar rejeição por magic bytes.

### [API-006] `maxDuration` (300/60/30s) depende do plano Vercel e não tem equivalente na migração para Docker Swarm
- **Severidade:** P2
- **Status:** Aberto (verificação manual)
- **Local:** src/app/api/sermons/slides/upload/route.ts:22 (`maxDuration = 300`), slides/[slideId]/route.ts:15 (`60`), ai/suggest/route.ts:13 e import/route.ts:17 (`30`); não há `vercel.json` no repo.
- **Evidência:** `export const maxDuration = 300;` sem `vercel.json` que fixe plano/limite. No plano Hobby da Vercel o teto é 60s — 300s seria rebaixado e uploads de PDFs grandes falhariam silenciosamente por timeout. Fora da Vercel (Swarm + Traefik) `maxDuration` não existe: o timeout precisa ser configurado no proxy/servidor Node.
- **Impacto:** Em produção no plano errado, conversão de PDF grande estoura o timeout e o usuário perde o upload sem mensagem clara. Na migração, sem configurar timeout no Traefik/Node, os handlers longos ficam sem teto (agrava API-002).
- **Correção:** Confirmar o plano Vercel atual (Pro suporta 300s; Hobby não) e documentar; se Hobby, reduzir o pipeline para caber em 60s ou processar assíncrono. Para a migração, configurar timeouts explícitos no Traefik (`respondingTimeouts`) e no servidor Node, e mover conversão pesada para fila/worker.
- **Verificação:** `vercel inspect`/painel para ver o plano e o limite efetivo de duração das functions; testar upload de PDF que leve >60s e observar o comportamento.

### [API-007] POSTs que criam recurso não têm idempotência (duplo clique duplica)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/sermons/import/route.ts:97-109 (insert de sermão), slides/manual/route.ts:43-49 (insert de slide vazio), slides/upload/route.ts:249-274 (insert de N slides).
- **Evidência:** Nenhuma rota aceita chave de idempotência; `import` faz `insert(...).select("id").single()` sempre criando novo sermão; `manual` insere sempre um slide novo em `nextOrder`. O guard `busy` em src/app/(app)/import/page.tsx:31-46 é só de UI.
- **Impacto:** Duplo submit / retry de rede cria sermão duplicado ou slides duplicados. Baixo dano (dados do próprio usuário), mas polui o banco.
- **Correção:** Aceitar header `Idempotency-Key` opcional e deduplicar (tabela de chaves ou upsert por chave); no mínimo, para `manual`, calcular `nextOrder` e inserir com constraint única `(sermon_id, order)` já existente para colidir em corrida.
- **Verificação:** Disparar a mesma requisição 2x em paralelo e confirmar um único recurso criado.

### [API-008] Envelope de erro inconsistente e `request.json()` sem try/catch em algumas rotas
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/ai/suggest/route.ts:93 (`const json = await request.json();` fora do try), slides/google/route.ts:34 (`const body = await request.json();` sem catch); formato de erro varia (`{ error: string }`, às vezes `{ error, details }`), enquanto a referência pede `{ error: { code, message } }`.
- **Evidência:** As rotas de slides `[slideId]`/`upload` usam `await request.json().catch(() => null)`, mas `suggest` e `google` não — body malformado gera exceção não tratada → 500 genérico do Next. O shape de erro não é padronizado entre rotas.
- **Impacto:** Cliente enviando JSON inválido recebe 500 opaco em vez de 400; front tem que lidar com formatos de erro diferentes por rota.
- **Correção:** Padronizar leitura de body com `.catch(() => null)` + 400 "Corpo inválido", e adotar o envelope `{ error: { code, message } }` do helper de API-003 em todas as rotas.
- **Verificação:** `curl -XPOST /api/ai/suggest -d 'x'` (não-JSON) deve responder 400, não 500.

### [API-009] `version`/`book` do usuário são interpolados na URL do upstream sem encode/allowlist
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/lib/bible/client.ts:107 (`/verses/${version}/${abbrev}/${chapter}`), :117, :144; params validados só como `z.string().min(2).max(20)` (version) e `min(1).max(10)` (book) em src/app/api/bible/chapter/route.ts:11-15 e demais rotas.
- **Evidência:** `version` e `book` vêm de `searchParams.get(...)` (já decodificados) e entram na path do fetch sem `encodeURIComponent` e sem allowlist de caracteres — um valor como `ntlh/..` altera a path do upstream.
- **Impacto:** Manipulação de path dentro do host fixo abibliadigital.com.br (não é SSRF de host, mas permite atingir endpoints não pretendidos / respostas inesperadas). Baixo risco por host fixo, mas é entrada crua do usuário na URL externa.
- **Correção:** Validar `version` contra a lista de versões suportadas (src/lib/bible/versions.ts) e `book` contra as abreviações canônicas (src/lib/bible/books.ts) com `z.enum`/refine; aplicar `encodeURIComponent` na montagem da URL.
- **Verificação:** Passar `version=foo/bar` e confirmar 400 (rejeitado pela allowlist) em vez de repassar à API externa.

### [API-010] `/api/series-and-courses` sem `runtime`/`dynamic` explícito, sem filtro `user_id` e engole erros com 200 vazio
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/series-and-courses/route.ts:8-59 (sem `export const runtime/dynamic`), :25-36 (queries em series/courses/course_lessons sem `.eq("user_id", ...)`), :57-59 (`catch { return empty }`).
- **Evidência:** É o único handler sem config de runtime/dynamic. Atualmente é dinâmico na prática porque `createClient()` chama `cookies()` (src/lib/supabase/server.ts:9), o que opta a rota para render dinâmico — por isso o build a marcou `ƒ`. Mas isso é implícito: as queries confiam 100% na RLS (não filtram `user_id`), e qualquer erro vira `{ series: [], courses: [] }` com 200.
- **Impacto:** Segurança depende exclusivamente de a RLS estar correta e de `cookies()` continuar forçando dynamic; um refactor que troque a leitura de sessão poderia (teoricamente) permitir cache estático e vazamento entre usuários. O `catch` silencioso mascara falhas reais (sem observabilidade) e devolve 200 mesmo não-autenticado.
- **Correção:** Adicionar `export const runtime = "nodejs"; export const dynamic = "force-dynamic";` como nas demais rotas autenticadas; manter defesa em profundidade com `.eq("user_id", user.id)` nas queries; logar o erro no `catch` (server-side) antes de degradar.
- **Verificação:** Conferir no build que segue `ƒ` após tornar explícito; simular erro de banco e confirmar que aparece no log do servidor.

### [API-011] Guard de propriedade em `slides/[slideId]` falha aberto se o join não trouxer dono
- **Severidade:** P3
- **Status:** Aberto
- **Local:** src/app/api/sermons/slides/[slideId]/route.ts:42-44 (`if (owner && owner !== userId) return null;`).
- **Evidência:** `const owner = data.sermons?.user_id; if (owner && owner !== userId) return null;` — se `owner` vier `undefined/null` (join sem sermão), a condição é falsa e o código NÃO retorna null, tratando o slide como próprio. A proteção efetiva recai só na RLS da tabela `slides`.
- **Impacto:** Defesa em profundidade fail-open: se a RLS de `slides` for afrouxada/mal configurada, DELETE/PUT sobre slide de terceiro passariam. Hoje mitigado pela RLS + `!inner` join, mas o guard não deveria confiar nisso.
- **Correção:** Trocar para fail-closed: `if (!owner || owner !== userId) return null;`.
- **Verificação:** Testar com slide cujo join de sermão não retorne dono (simulando) e confirmar 404 em vez de prosseguir.

## Cobertura
- **/api/ai/suggest** (POST) — Achado API-001 (custo/rate), API-002 (timeout OpenAI), API-003 (leak err), API-004 (sem schema resposta), API-008 (json sem catch). Auth ✔ (getUser), plano/ai_enabled ✔, Zod body ✔.
- **/api/bible** (GET) — Achado API-002 (timeout), API-003 (leak upstream body), API-004 (sem retry/schema), API-009 (version cru). Zod query ✔, cache 24h/30d ✔, 422 p/ ref não reconhecida ✔.
- **/api/bible/books** (GET) — OK. Catálogo local estático, cache 1 ano, sem entrada de usuário, sem chamada externa.
- **/api/bible/chapter** (GET) — Achado API-002, API-003, API-004, API-009 (version/book crus). Zod com `coerce.number().min(1).max(150)` ✔.
- **/api/bible/random** (GET) — Achado API-002, API-003, API-004, API-009 (version cru). Cache 12h ✔.
- **/api/bible/search** (GET) — Achado API-002, API-003, API-004, API-009 (version cru). Zod `q.min(2).max(100)` ✔.
- **/api/series-and-courses** (GET) — Achado API-010 (sem runtime/dynamic explícito, sem user_id, catch silencioso). Dinâmico na prática via cookies(); RLS cobre o escopo hoje.
- **/api/sermons/export** (GET) — OK majoritário. Auth ✔, `.eq("user_id")` ✔, soft-delete ✔, 503 em modo demo ✔, 404 ✔, filename sanitizado ✔. (herda API-003 se erro de banco surgir; export não faz chamada externa).
- **/api/sermons/import** (POST) — Achado API-003 (error.message do Supabase), API-007 (idempotência). Auth ✔, Zod meta ✔, limite 10MB ✔, 413/415/422 corretos ✔.
- **/api/sermons/import/template** (GET) — OK. **Correção da premissa do inventário:** a rota EXPORTA `GET` (src/app/api/sermons/import/template/route.ts:9) — NÃO é rota morta/405. Conteúdo estático, sem auth (aceitável), cache 5min.
- **/api/sermons/slides/[slideId]** (DELETE, PUT) — Achado API-011 (guard fail-open), API-003 (error.message). Auth ✔, ownership via join+RLS ✔, PUT valida path/rejeita PDF ✔, renumeração ✔, sharp resize ✔.
- **/api/sermons/slides/google** (POST) — Achado API-008 (json sem catch). Auth ✔, Zod url + refine docs.google.com ✔, `.eq("user_id")` ✔, idempotente (update) ✔.
- **/api/sermons/slides/manual** (POST) — Achado API-007 (duplo clique duplica slide). Auth ✔, ownership ✔, Zod sermonId uuid ✔.
- **/api/sermons/slides/upload** (POST) — Achado API-005 (tamanho/páginas/magic bytes), API-006 (maxDuration 300), API-007 (idempotência). Auth ✔, ownership ✔, `isValidSourcePath` ✔, cleanup de órfãos ✔.

### Verificações transversais
- **CORS:** nenhuma rota define `Access-Control-Allow-Origin` (grep em src/ = 0). OK.
- **Chaves no client:** `OPENAI_API_KEY` (ai/client.ts:11) e `BIBLE_API_TOKEN` (bible/client.ts:49) só em módulos server; nenhum `NEXT_PUBLIC_*` com essas chaves; `SUPABASE_SERVICE_ROLE_KEY` só em lib/admin e lib/supabase/server (grep confirma). OK.
- **Comportamento sem env:** OpenAI ausente → `getOpenAI()` lança e cai no catch → 500 com "OPENAI_API_KEY não configurado" (mensagem interna vaza — ver API-003; ideal 503 genérico). Bible sem `BIBLE_API_TOKEN` → header vazio; se o upstream exigir token, retorna o status dele. import/export têm 503 "modo demo" claro quando falta Supabase.
- **Portão:** typecheck e lint verdes no inventário; sem testes automatizados (0) — nenhum teste cobre estas rotas (pendência QA, cross-domínio).
