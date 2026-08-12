# Auditoria — LGPD (Compliance e Proteção de Dados)
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/10-compliance-lgpd.md · Itens do inventário cobertos: 13/13 áreas obrigatórias (A–I)_

## Resumo
- Itens verificados: 13 · Achados: **P0=2 · P1=3 · P2=5 · P3=3** · Nota do domínio: **2/10**
- Contexto agravante: sermões/notas/estudo guiado carregam **dado sensível** (convicção religiosa, art. 5º II LGPD) e **dado de terceiros** (membros citados em notas de aconselhamento; local/audiência/feedback de pregação em `sermon_engagements`). Isso eleva o dever de cuidado.

## Inventário de dados pessoais coletados (Cobertura A)
| Tabela (migration) | Campos pessoais | Natureza | Base legal plausível | Retenção observada |
|---|---|---|---|---|
| `profiles` (001) | `name`, `denomination`, `avatar_url` | Identificação; denominação ≈ convicção religiosa (**sensível**) | Execução de contrato | Indefinida; não apagada na exclusão de conta (ver LGPD-002) |
| `auth.users` (Supabase) | email, senha (hash), sessões | Identificação/credencial | Execução de contrato | Indefinida; só apagada via admin |
| `signup_interests` (016/021) | `email`, `name`, `phone`, `denomination`, `message`, `source_ip`, `source_ua` | Identificação + IP/UA + denominação (**sensível**) | Sem base declarada / consentimento (ver LGPD-003) | Indefinida, sem TTL nem FK ao usuário (ver LGPD-006/007) |
| `sermon_engagements` (012) | `location`, `audience_size`, `rating`, `feedback`, `preached_at` | **Dado de terceiros** (onde/para quem pregou) | Legítimo interesse (a documentar) | Indefinida |
| `notes` (018) | `title`, `content` | Rascunhos pastorais; podem citar membros (**terceiros/sensível**) | Execução de contrato | Soft-delete `deleted_at`/`archived_at` sem expurgo |
| `study_sessions` (008) | `notes_content` (jsonb) | Notas de estudo/aconselhamento | Execução de contrato | Indefinida |
| `sermons` (003) | `title`, `content` (jsonb), `bible_ref`, `tags` | Conteúdo pastoral (**convicção religiosa, sensível**) | Execução de contrato | Soft-delete + arquivo sem expurgo |
| `slides` (004) + Storage `sermon-slides` | imagens de slides | Conteúdo (pode conter pessoas/fotos) | Execução de contrato | Bucket privado; **não apagado** na exclusão (ver LGPD-006) |
| `chapter_exegeses` (023/026) | `generated_by` (uid) | Vínculo de uso | Execução de contrato | Cache global permanente |

---

## Achados

### [LGPD-001] Não existe Política de Privacidade nem Termos de Uso no produto
- **Severidade:** P0
- **Status:** Aberto
- **Local:** `src/app/(public)/page.tsx:875-913` (footer sem link legal); `src/app/auth/register/page.tsx:6-29`; ausência de rota `/privacidade`, `/termos`, `/legal` em toda a árvore `src/app/**`.
- **Evidência:** `grep -rniE "privacidad|termos de uso|LGPD|consentiment" src/` retorna apenas uma menção solta em `src/components/settings/SettingsPlanForm.tsx:204` ("Política de privacidade" como título de um parágrafo dentro de Settings, não uma página). O `SiteFooter` (`page.tsx:888-907`) lista só âncoras de marketing (`#porque`, `#exegese`, `#faq`, `#preco`, `/auth/login`, `#cadastro`) — nenhum link para Política de Privacidade ou Termos. Nenhum `page.tsx` correspondente a documento legal existe no inventário de rotas.
- **Impacto:** Sem Política de Privacidade e Termos de Uso publicados não há como informar o titular (art. 9º LGPD) nem estabelecer base de tratamento e obrigações contratuais. Cobrar de clientes (SaaS pago) sem esses documentos é **bloqueante**: expõe a autuação ANPD, nulidade de cláusulas e impossibilidade de comprovar transparência. A skill classifica divergência prática↔documento como P1; a **ausência total** de documento é mais grave.
- **Correção:**
  1. Criar rota pública `src/app/(public)/privacidade/page.tsx` com a Política de Privacidade (finalidades, bases legais por tratamento conforme o inventário acima, subprocessadores — ver LGPD-004, direitos do titular, contato do Encarregado — ver LGPD-009, retenção — ver LGPD-007).
  2. Criar rota pública `src/app/(public)/termos/page.tsx` com os Termos de Uso.
  3. Adicionar links para ambas no `SiteFooter` (`src/app/(public)/page.tsx:888`) e no rodapé do layout autenticado.
  4. Texto deve ser revisado por jurídico antes de publicar (a referência exige alinhamento com documentos revisados).
- **Verificação:** `curl -I https://<app>/privacidade` e `/termos` retornam 200; links visíveis no footer; `grep -ri "Política de Privacidade" src/app/(public)` acha a página.

### [LGPD-002] "Excluir conta" não elimina os dados e a UI promete remoção que não acontece
- **Severidade:** P0
- **Status:** Aberto
- **Local:** `src/lib/profile/actions.ts:189-203` (`deleteAccountAction`); UI em `src/components/settings/SettingsDeleteAccount.tsx:51-54`.
- **Evidência:** A action inteira:
  ```ts
  export async function deleteAccountAction(): Promise<ActionResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Não autenticado" };
    await supabase.from("sermons")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", user.id);
    await supabase.auth.signOut();
    return { ok: true };
  }
  ```
  Ela apenas marca `sermons.deleted_at` e faz `signOut`. **Não** apaga `auth.users`, `profiles`, `notes`, `study_sessions`, `sermon_engagements`, `series`, `courses`, `slides`, objetos do Storage, nem `signup_interests`. A UI afirma: *"Esta ação é irreversível. Seus sermões serão arquivados por 30 dias e depois removidos"* (`SettingsDeleteAccount.tsx:52`), mas **não existe nenhuma rotina de expurgo** (grep por `cron|pg_cron|expurg|purge|retention` em `src/` e `supabase/` não encontra job algum).
- **Impacto:** Viola o direito de eliminação (art. 18, VI, LGPD): o usuário clica "Excluir conta", recebe toast "Conta excluída" e é deslogado, mas conta, perfil, notas pastorais, notas de estudo, registros de pregação e slides **permanecem intactos** no banco e no Storage indefinidamente. A promessa de "remoção em 30 dias" é **falsa** (nenhum expurgo roda), configurando informação enganosa ao titular. Para um SaaS pago isso é bloqueante.
- **Correção:**
  1. Reescrever `deleteAccountAction` para eliminação real via `createServiceClient()`: (a) remover objetos do Storage sob `${user.id}/**` no bucket `sermon-slides`; (b) apagar `signup_interests` com o mesmo email; (c) chamar Auth Admin API `DELETE /auth/v1/admin/users/${user.id}` (o cascade de FK `on delete cascade` em `profiles` → `sermons`/`notes`/`engagements`/`study_sessions`/`series`/`courses` limpa o banco); (d) só então `signOut`.
  2. Se optar por período de carência de 30 dias, implementar de fato um job (pg_cron ou route protegida por cron da Vercel) que expurgue contas marcadas há >30 dias, e ajustar a cópia da UI ao comportamento real.
  3. Registrar a exclusão em audit trail (ver LGPD-010).
- **Verificação:** Criar usuário de teste, popular sermão+nota+slide, executar exclusão, e confirmar via `service_role` que `auth.users`, `profiles`, `notes`, `slides` e os objetos do Storage do uid sumiram. Automatizar em teste de integração.

### [LGPD-003] Consentimento não capturado nem registrado (sem aceite de Termos/Política, sem versão/data)
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/components/auth/RegisterForm.tsx:77-174` (formulário de interesse); `src/lib/interests/actions.ts:12-117` (`submitInterestAction`); `src/app/auth/register/page.tsx:6-29`.
- **Evidência:** O formulário coleta `name`, `email`, `phone`, `denomination`, `message` e o servidor grava ainda `source_ip` e `source_ua` (`interests/actions.ts:68-103`). Não há checkbox "Li e aceito os Termos de Uso e a Política de Privacidade", nem campo/coluna registrando **quando** e **qual versão** foi aceita (a tabela `signup_interests` em `016_signup_interests.sql:5-20` não tem `consent_at`/`terms_version`). O `createUserAction` (`admin/users.ts:46-112`) cria o usuário definitivo sem qualquer registro de consentimento. Observação: o design de referência previa o checkbox ("Checkbox 'Li e aceito os termos de uso'" em `docs/references/stitch-prompts.md:365`), mas ele não foi implementado.
- **Impacto:** Sem prova de consentimento (o que, quando, versão) não há como demonstrar base legal de consentimento onde ela for necessária (art. 8º, §1º LGPD exige que o controlador comprove o consentimento), inclusive para o dado sensível de denominação e para uso de IA. Coleta de PII (incl. IP/UA/telefone) sem base documentada = P1 pela referência.
- **Correção:**
  1. Adicionar no `RegisterForm` (e no fluxo de criação de conta) checkbox obrigatório de aceite com links para `/termos` e `/privacidade`.
  2. Adicionar colunas `consent_at timestamptz` e `terms_version text` (e `privacy_version text`) em `signup_interests` e em `profiles`; gravar no `submitInterestAction` e no `createUserAction`.
  3. Validar o aceite com Zod no servidor (não confiar no client).
- **Verificação:** Enviar interesse sem marcar o checkbox → rejeitado; com aceite → linha em `signup_interests` com `consent_at`/`terms_version` preenchidos.

### [LGPD-004] Conteúdo pastoral enviado à OpenAI (EUA) sem aviso adequado e com afirmação divergente da prática
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/api/ai/suggest/route.ts:105-128`; `src/lib/exegesis/actions.ts:229-269`; afirmação em `src/components/settings/SettingsPlanForm.tsx:203-209`.
- **Evidência:** Em `/api/ai/suggest` o `userPrompt` inclui `topic` e o conteúdo dos blocos já escritos do sermão — `existingBlocks.map(b => ... ${b.content.slice(0, 200)})` (`route.ts:108-112`) — e é enviado a `openai.responses.create(...)` (`route.ts:122-128`). Na exegese, `fetchChapterAsContext` injeta o texto do capítulo e dispara 5 chamadas à OpenAI (`exegesis/actions.ts:230-269`). A OpenAI é subprocessador nos **EUA** (transferência internacional). A única "informação" ao usuário é `SettingsPlanForm.tsx:206-209`: *"O conteúdo enviado para a IA é descartado depois da resposta. Nenhum manuscrito é armazenado ou usado para treinar modelos."* — afirmação não garantida (a API da OpenAI retém dados por até 30 dias para monitoramento de abuso, salvo zero-retention contratado) e que não menciona transferência para os EUA. Nenhuma menção a OpenAI/EUA existe na landing, na Política (inexistente) ou no fluxo de exegese.
- **Impacto:** Transferência internacional de dados (art. 33 LGPD) e tratamento por subprocessador sem transparência (art. 9º) e possivelmente sem base adequada — agravado por o conteúdo poder incluir dado sensível/de terceiros. A afirmação "descartado depois da resposta" pode divergir da prática real da OpenAI (divergência prática↔documento = P1).
- **Correção:**
  1. Divulgar OpenAI como subprocessador (EUA) na Política de Privacidade, com garantia de transferência internacional (cláusulas-padrão/adequação) e finalidade.
  2. Ajustar a afirmação de `SettingsPlanForm.tsx:206-209` para refletir a política real da OpenAI (retenção de até 30 dias para abuso, opt-out de treino), ou contratar zero data retention e então manter a frase.
  3. Exibir aviso explícito de "o conteúdo é enviado para um provedor de IA nos EUA" no ponto de uso (botão de sugestão/exegese), antes do envio.
- **Verificação:** Política publicada lista OpenAI/EUA; UI de IA mostra o aviso antes do primeiro envio; texto de Settings coerente com o contrato OpenAI vigente.

### [LGPD-005] Portabilidade parcial: exportação cobre apenas UM sermão, não todos os dados do titular
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/api/sermons/export/route.ts:548-556` e `571-577`.
- **Evidência:** O handler exige `sermonId` (`querySchema` em `route.ts:27-30`) e faz `select("title, bible_ref, content, framework").eq("id", sermonId)` (`route.ts:571-577`). Exporta um único manuscrito em PDF/DOCX/TXT. Não há endpoint/fluxo que exporte o conjunto completo do titular (perfil, todas as notas, `study_sessions`, `sermon_engagements`, séries/cursos).
- **Impacto:** Direito de portabilidade/acesso (art. 18, II e V LGPD) atendido apenas parcialmente. O titular não consegue obter uma cópia completa e estruturada dos seus dados.
- **Correção:** Criar rota `src/app/api/account/export/route.ts` (autenticada por `getUser`) que agregue todos os dados do titular (profiles, sermons incl. arquivados, notes, study_sessions, sermon_engagements, series, courses, signup_interest correspondente) em um JSON/ZIP e ofereça download. Linkar em `/settings`.
- **Verificação:** Baixar o export completo com usuário de teste e conferir que todas as tabelas com `user_id` do titular aparecem.

### [LGPD-006] Exclusão pelo admin deixa resíduo no Storage e em `signup_interests`
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/lib/admin/users.ts:224-256` (`deleteUserAction`); Storage em `supabase/migrations/004_slides.sql:44-75`; `signup_interests` em `016_signup_interests.sql`.
- **Evidência:** `deleteUserAction` só chama `DELETE /auth/v1/admin/users/${userId}` (`users.ts:239-248`). O cascade de FK (`profiles.id references auth.users on delete cascade`, e as tabelas referenciando `profiles(id) on delete cascade`) limpa o **banco**, mas os objetos do Storage em `sermon-slides` gravados no path `${user.id}/${sermonId}/...webp` (`slides/upload/route.ts:251`) **não** são removidos por cascade de banco — Storage é separado. Além disso `signup_interests` não tem FK ao usuário (`016:5-20`), então `email`/`phone`/`name`/`source_ip`/`source_ua` do titular **permanecem** após a exclusão.
- **Impacto:** Eliminação incompleta — cópias de dados pessoais (imagens de slides que podem conter pessoas; email/telefone/IP no interesse) sobrevivem à exclusão. A referência classifica "exclusão que deixa cópia no storage/log" como P1.
- **Correção:** Em `deleteUserAction` (e na correção de LGPD-002): antes/depois do delete do Auth, (a) `storage.from('sermon-slides').remove([...])` de todos os objetos sob `${userId}/`; (b) apagar/anonimizar as linhas de `signup_interests` do email do titular. Considerar `list` recursivo do prefixo do uid para montar a lista de remoção.
- **Verificação:** Excluir usuário de teste com slides e interesse; confirmar via `service_role` que o prefixo `${uid}/` no bucket está vazio e que `signup_interests` do email sumiu.

### [LGPD-007] Retenção sem prazos definidos nem rotina de expurgo
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `supabase/migrations/003_sermons.sql:22` (`deleted_at`), `017_archive_sermons.sql:9-14` (`archived_at`), `018_notes.sql:14-15`, `016_signup_interests.sql:5-20`. Ausência de job: `grep -rniE "cron|pg_cron|expurg|purge|retention|schedule" src/ supabase/` não encontra rotina de expurgo.
- **Evidência:** Registros com soft-delete (`deleted_at`) e arquivados (`archived_at`) permanecem no banco indefinidamente; a UI fala em "arquivado por 30 dias" (`DeleteSermonDialog.tsx:58`, `SettingsDeleteAccount.tsx:52`) mas nenhum agendamento apaga após esse prazo. `signup_interests` (incl. `source_ip`, `source_ua`, `phone`) não tem TTL — o próprio comentário da migration diz que IP/UA são "pra detectar abuso de formulário" (016:13-19), uso que não justifica retenção perpétua.
- **Impacto:** Falta de definição de prazos e expurgo viola o princípio de necessidade/eliminação após fim do tratamento (art. 15 e 16 LGPD) e contradiz a promessa de "30 dias" mostrada ao usuário.
- **Correção:** Definir política de retenção por tabela e implementar expurgo (pg_cron ou cron da Vercel + route protegida): apagar sermons/notes com `deleted_at`/`archived_at` > 30 dias; expirar `signup_interests` (ex.: 12 meses) e zerar `source_ip`/`source_ua` após a janela anti-abuso (ex.: 30 dias). Documentar os prazos na Política.
- **Verificação:** Rodar o job em ambiente de teste com registro antigo simulado e confirmar remoção; conferir prazos publicados na Política.

### [LGPD-008] Dado sensível (convicção religiosa) e de terceiros sem base/salvaguarda documentada
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `supabase/migrations/003_sermons.sql:17` (`content` jsonb), `018_notes.sql:11` (`content`), `008_study.sql:33` (`notes_content`), `012_sermon_engagements.sql:11-15` (`location`, `audience_size`, `feedback`), `001_profiles.sql:8` (`denomination`).
- **Evidência:** O conteúdo pastoral (sermões, notas, notas de estudo) é, por natureza, dado sobre convicção religiosa — dado sensível (art. 5º, II LGPD) — e pode conter dados de terceiros (membros citados em aconselhamento; `sermon_engagements.location`/`feedback` descrevem onde/para quem se pregou). Não há na base nenhum tratamento diferenciado, aviso, nem base legal específica declarada para dado sensível/de terceiros (nenhum documento — ver LGPD-001 — e nenhum campo de consentimento — ver LGPD-003).
- **Impacto:** Tratamento de dado sensível exige base legal específica do art. 11 e transparência reforçada. Dado de terceiros (membros) sem informá-los pode configurar tratamento sem base. Risco de dano relevante em caso de vazamento (segredo pastoral/aconselhamento).
- **Correção:** Na Política (LGPD-001) declarar expressamente que o conteúdo pode conter dado sensível e de terceiros, a base legal aplicável (execução de contrato + tutela do titular; para terceiros, orientar o pastor sobre responsabilidade), e as salvaguardas (RLS, criptografia, acesso restrito). Avaliar com jurídico a necessidade de instrução ao usuário sobre não inserir dados identificáveis de terceiros sem necessidade.
- **Verificação:** Cláusula específica de dado sensível/terceiros presente e revisada por jurídico; controles técnicos (RLS/cripto) referenciados.

### [LGPD-009] Ausência de canal do titular e de Encarregado (DPO)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** Todo o produto — `grep -rniE "encarregad|\bDPO\b|privacidade@|dados pessoais" src/` retorna apenas o parágrafo de Settings (`SettingsPlanForm.tsx:204`) e nada de contato.
- **Evidência:** Não há e-mail de privacidade, formulário de requisição do titular, nem indicação de Encarregado em qualquer rota, footer ou documento.
- **Impacto:** A LGPD (art. 41) exige a indicação de Encarregado e um canal para o titular exercer direitos e para comunicação da ANPD. Sem isso, requisições de titular não têm porta de entrada.
- **Correção:** Publicar na Política (LGPD-001) o nome/e-mail do Encarregado e um canal (e-mail dedicado, ex.: `privacidade@<dominio>`) para requisições; opcionalmente uma rota `/settings` "Solicitar meus dados / Excluir conta" que já dispare os fluxos de LGPD-002/005.
- **Verificação:** Contato do Encarregado visível na Política e no footer; e-mail funcional.

### [LGPD-010] Sem trilha de auditoria para exclusão e alteração de permissão/plano
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/lib/admin/users.ts:114-256` (`updateUserRoleAction`, `updateUserPlanAction`, `setUserActiveAction`, `deleteUserAction`); `src/lib/profile/actions.ts:189-203` (`deleteAccountAction`).
- **Evidência:** Nenhuma dessas operações sensíveis (mudança de role/plano, desativação, exclusão de conta/usuário) grava registro de quem/o quê/quando. Não há tabela de audit log nas 32 migrations.
- **Impacto:** O CLAUDE.md exige audit trail para operações sensíveis (exclusão, alteração de permissão, billing). A LGPD (art. 37 — registro das operações; art. 6º, X — responsabilização e prestação de contas) demanda rastreabilidade. Sem log, um vazamento entre tenants ou uma exclusão indevida não é auditável.
- **Correção:** Criar tabela `audit_log` (actor_id, action, target_id, metadata jsonb, created_at) com RLS restrita a admin, e gravar em cada action sensível de `admin/users.ts` e em `deleteAccountAction`.
- **Verificação:** Executar cada action e confirmar linha correspondente em `audit_log`.

### [LGPD-011] Minimização: IP e User-Agent coletados sem base/aviso e sem prazo
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/interests/actions.ts:68-103`; `supabase/migrations/016_signup_interests.sql:13-19`.
- **Evidência:** `sourceIp`/`sourceUa` são extraídos dos headers e gravados em `signup_interests.source_ip`/`source_ua` para "anti-abuso futuro" (comentário do código e da migration), mas o formulário já tem cooldown em memória (`interests/actions.ts:42-50`); a coleta e retenção perpétua de IP/UA excede o necessário e não é informada ao titular.
- **Impacto:** Fere o princípio de minimização (art. 6º, III LGPD) e coleta PII (IP) sem informar.
- **Correção:** Ou remover a coleta de IP/UA, ou dar-lhe finalidade/base clara na Política e prazo curto de expurgo (ver LGPD-007). Se mantido, informar no formulário.
- **Verificação:** Política descreve o uso de IP/UA e o prazo; job de expurgo zera os campos após a janela.

### [LGPD-012] Cookies: apenas essenciais (sessão Supabase) — dispensa de banner a documentar
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/supabase/server.ts:14-26`, `src/lib/supabase/middleware.ts:15-30`.
- **Evidência:** Os únicos cookies observados são os de sessão do Supabase Auth (lidos/escritos em `server.ts`/`middleware.ts`). `grep` por trackers (analytics, GA, pixel, fbq) não encontra rastreadores. Não há banner de cookies.
- **Impacto:** Como só há cookie essencial de autenticação, a ausência de banner é **aceitável** — mas isso precisa estar documentado na Política de Cookies/Privacidade para constar como decisão consciente. Se no futuro entrar analytics/tracker, banner com opt-in passa a ser obrigatório (carregar tracker antes do consentimento = P1).
- **Correção:** Documentar na Política que só são usados cookies essenciais de sessão (sem consentimento prévio necessário). Ao adicionar qualquer tracker, implementar banner com recusa real.
- **Verificação:** Seção de cookies na Política; `grep` confirma ausência de trackers no build.

### [LGPD-013] Residência dos dados (região Supabase/Storage) a confirmar e divulgar
- **Severidade:** P3
- **Status:** Aberto (verificação manual)
- **Local:** `.env.example:8` (`NEXT_PUBLIC_SUPABASE_URL`); infra não versionada no repo.
- **Evidência:** A região do projeto Supabase (e portanto do Postgres + Storage) não é determinável pelo código. O produto é PT-BR e pretende ser vendido a igrejas brasileiras; a Política precisará informar onde os dados residem, e há a migração planejada para VPS/MinIO (CLAUDE.md) que muda a residência.
- **Impacto:** Transparência sobre local de tratamento (art. 9º/33 LGPD). Divergência entre a residência real e o prometido ao titular seria P1.
- **Correção:** Confirmar no dashboard Supabase a região do projeto (`jzotuzxqekzymvcitxpq`) e divulgá-la na Política; ao migrar para VPS, atualizar. Se a região for fora do Brasil, tratar como transferência internacional.
- **Verificação:** Região confirmada no dashboard e refletida na Política.

---

## Cobertura (itens obrigatórios A–I)
- **A) Inventário de dados pessoais** — Coberto. Tabela de inventário acima a partir das migrations 001/003/004/008/012/016/018/021/023/026. Veredito: mapeado; bases/retenção deficientes (LGPD-002/003/007/008).
- **B) Consentimento** (RegisterForm / interests/actions / createUser) — **Achado LGPD-003**. Sem checkbox, sem versão/data.
- **C) Documentos obrigatórios** (Política/Termos) — **Achado LGPD-001**. Inexistentes.
- **D) Direitos do titular** — acesso/portabilidade **LGPD-005** (parcial); eliminação **LGPD-002** (não apaga) + **LGPD-006** (resíduo storage/interesses); correção via `updateProfileBasicAction` (`profile/actions.ts:26-50`) = **OK**; canal/prazo **LGPD-009**.
- **E) Retenção/expurgo** — **Achado LGPD-007**. Sem prazos nem job.
- **F) Subprocessadores/transferência internacional** — **Achado LGPD-004** (OpenAI/EUA); Supabase/Vercel/abibliadigital a listar na Política (LGPD-001). abibliadigital recebe apenas referência bíblica (não PII) — menor risco.
- **G) Segurança como dever legal** — RLS habilitada em todas as tabelas de dados do usuário (001/003/004/008/012/018 etc.) e hardening em 014/015/029 = **OK parcial**; falta trilha de auditoria **LGPD-010** e registro de incidente (a definir na Política).
- **H) Cookies/rastreamento** — **LGPD-012**. Só cookie essencial; documentar dispensa de banner.
- **I) Encarregado (DPO)/canal** — **Achado LGPD-009**. Ausente.
