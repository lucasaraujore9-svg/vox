# Auditoria — SaaS / Produto (vendabilidade)
_Data: 2026-08-12 · Referência: .claude/skills/auditoria-saas/references/09-saas-produto.md · Itens do inventário cobertos: 18/18 relevantes ao domínio_

## Resumo
- Itens verificados: 18 · Achados: P0=2 P1=5 P2=4 P3=2 · Nota do domínio: **2/10**
- Pergunta central ("isto é vendável hoje?"): **NÃO.** Não existe forma de cobrar (zero gateway), e o gate pago é auto-liberável de graça pelo próprio usuário.

## Achados

### [SAAS-001] Não existe nenhum meio de cobrança — o produto não pode faturar
- **Severidade:** P0
- **Status:** Aberto
- **Local:** `supabase/migrations/022_plans.sql:7-24`; `src/components/settings/SettingsPlanForm.tsx:7-8,215-257`; ausência confirmada por grep
- **Evidência:** O único artefato de billing é a coluna `profiles.plan text default 'manuscrito' check (plan in ('manuscrito','concilio'))`. `grep -rilE "stripe|asaas|mercadopago|checkout|paddle|gateway|webhook|payment"` em `src/` e `supabase/` só retorna `page.tsx`, `SettingsPlanForm.tsx` e `022_plans.sql` — todos apenas texto/labels, nenhuma integração. `SettingsPlanForm.tsx:7-8` admite: `// Próxima cobrança (placeholder até billing integrar) // Histórico de faturas (placeholder até billing integrar)`. As seções "Próxima cobrança" (linhas 215-237) e "Histórico de faturas" (239-257) são caixas tracejadas estáticas ("Sem cobrança pendente" / "Nenhuma fatura ainda"). Não há dependência de gateway em `package.json`.
- **Impacto:** Trava a venda por completo. Os preços R$ 19,90/R$ 39,90 exibidos na landing (`src/app/(public)/page.tsx:685-751`) e em settings são decorativos: nenhum centavo pode ser cobrado. Sem webhook de pagamento, sem entitlement derivado de pagamento, sem estados de assinatura.
- **Correção:** 1) Integrar um gateway (Stripe ou Asaas, dado o alvo BR). 2) Criar tabela `subscriptions` (colunas: `user_id`, `plan`, `status` em `active|trialing|past_due|canceled`, `current_period_end`, `gateway_customer_id`, `gateway_subscription_id`, `updated_at`) com RLS (dono lê; escrita só via service_role). 3) Route handler `/api/billing/webhook` verificando assinatura do gateway e idempotente (dedupe por event id), que atualiza `subscriptions.status`/`plan`. 4) Derivar `profiles.plan` (entitlement) exclusivamente do webhook, nunca de ação do usuário (ver SAAS-002). 5) Fluxo de checkout `/api/billing/checkout` que cria sessão no gateway. 6) Tratar trial/upgrade/downgrade proporcional (a UI já promete "cobrança proporcional" em `SettingsPlanForm.tsx:139-141`).
- **Verificação:** Após integração, criar assinatura de teste no gateway em modo sandbox e confirmar que o webhook muda `subscriptions.status`/`profiles.plan`; cancelar e confirmar downgrade; `grep` deve mostrar o SDK do gateway sendo importado em route handler server-side (nunca em client).

### [SAAS-002] Gate pago totalmente contornável: usuário se promove a Concílio (com IA) de graça
- **Severidade:** P0
- **Status:** Aberto
- **Local:** `src/lib/profile/actions.ts:130-158` (`updatePlanAction`); chamada em `src/components/settings/SettingsPlanForm.tsx:47-66,153-161`
- **Evidência:** `updatePlanAction` roda para qualquer usuário autenticado e grava direto o plano escolhido, ligando a IA junto: `const updates = { plan: parsed.data.plan, ai_enabled: parsed.data.plan === "concilio" }; ... .update(updates).eq("id", user.id);` (linhas 145-153). Não há verificação de pagamento, de assinatura ativa nem de papel admin. Basta o usuário clicar no card "Concílio" em `/settings` → aba "Meu plano" (`SettingsPlanForm.tsx:153-161`) para virar Concílio e ativar a exegese assistida. O gate de IA em `/api/ai/suggest` (route.ts:70) e em `exegesis/actions.ts:168` confia em `profile.plan === 'concilio'` — que o próprio usuário setou de graça.
- **Impacto:** Mesmo depois de existir billing, a distinção paga é falsa: qualquer conta acessa o plano mais caro e o custo de OpenAI sem pagar. Margem negativa direta (custo de inferência por conta grátis) e receita zero mesmo com clientes "no plano Concílio".
- **Correção:** Remover a capacidade do usuário de alterar o próprio `plan`. `updatePlanAction` deve ser eliminado ou reduzido a iniciar um checkout (SAAS-001), nunca gravar `plan`. A escrita de `profiles.plan` deve ocorrer só via service_role a partir do webhook de pagamento. Adicionar trigger no Postgres `protect_plan_column` (espelhando `protect_role_column` de `013_user_roles.sql:39-56` e `protect_is_active_column` de `027_user_is_active.sql:19-31`) que bloqueia mudança de `plan` por quem não é admin/service_role. Em `SettingsPlanForm.tsx`, trocar os `onClick={() => switchPlan(...)}` por CTA de checkout/portal de assinatura.
- **Verificação:** Como usuário comum autenticado, tentar `updatePlanAction({plan:'concilio'})` (ou clicar no card) deve falhar/negar. Confirmar no banco que `update profiles set plan='concilio'` por role `authenticated` dispara `raise exception`.

### [SAAS-003] `/api/ai/suggest` sem cap de custo e sem rastreio; rate-limit só em memória (inócuo em serverless)
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/api/ai/suggest/route.ts:37-54,83-91,119-135`
- **Evidência:** O único freio é um bucket em memória de processo: `const buckets = new Map(...)`, `RATE_LIMIT = 10`, janela 1h (linhas 38-40), com o próprio arquivo admitindo no topo "Rate limit simples por usuário (10/h em memória). Em prod, mover... para Upstash/Redis" (linhas 2-3). Em Vercel (hospedagem alvo, CLAUDE.md), cada invocação pode cair em outra instância, então o contador reinicia e o limite não vale. Além disso, a resposta da OpenAI (linhas 122-135) não grava tokens nem custo em lugar nenhum — diferente da exegese, que grava em `chapter_exegeses` (`exegesis/actions.ts:333-350`). O cap mensal em USD (`exegesis/actions.ts:208-227`) NÃO cobre esta rota.
- **Impacto:** Custo de OpenAI ilimitado e não atribuído por esta rota. Um usuário Concílio pode disparar sugestões sem teto real e sem aparecer no painel de custo do admin (`/admin/ai`), corroendo a margem sem visibilidade.
- **Correção:** 1) Substituir o rate-limit em memória por Upstash Redis (já previsto no CLAUDE.md, cliente `@upstash/redis`), chave por `user.id`. 2) Registrar tokens/custo de cada chamada `/api/ai/suggest` em tabela de uso (reutilizar padrão de `chapter_exegeses` ou criar `ai_usage`) para atribuição e para o cap mensal. 3) Aplicar o mesmo `monthly_user_cap_usd` (`ai_settings`) a esta rota antes de chamar a OpenAI, igual a `exegesis/actions.ts:209-227`.
- **Verificação:** Chamar a rota de dois "processos" (ou duas regiões) e confirmar que o contador é compartilhado; após N chamadas, confirmar linha de custo gravada e que o cap mensal bloqueia com HTTP 429/403.

### [SAAS-004] Cota anunciada ("30 exegeses/mês") não é o que o código aplica (cap único global em USD)
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/app/(public)/page.tsx:734`; `src/components/settings/SettingsPlanForm.tsx:157`; enforcement em `src/lib/exegesis/actions.ts:208-227` + `supabase/migrations/024_ai_settings.sql:22`
- **Evidência:** A landing (`page.tsx:734`) e o card do plano (`SettingsPlanForm.tsx:157`) vendem "30 exegeses novas por mês" e "cache da comunidade ilimitado". O código não conta 30 nada: o único limite é `ai_settings.monthly_user_cap_usd` (default `5`, `024_ai_settings.sql:22`), um teto em dólares igual para todo mundo, checado em `exegesis/actions.ts:210-226` (`if (total >= settings.monthly_user_cap_usd) return {ok:false, ...}`). Não há coluna de cota por plano, nem contagem de 30, nem diferenciação Manuscrito×Concílio na cota.
- **Impacto:** Descasamento marketing × produto. Dependendo do custo real por exegese, o usuário pode conseguir muito mais ou muito menos que 30, gerando reclamação/estorno e risco de propaganda enganosa. Não há como o admin configurar "30/mês por plano".
- **Correção:** Definir a cota real: ou (a) trocar o texto de marketing para "cota mensal por gasto", ou (b) implementar contagem por unidade — adicionar `monthly_exegesis_quota` por plano (ex.: coluna em `ai_settings` ou tabela `plan_limits`) e, em `exegesis/actions.ts`, contar exegeses geradas por `generated_by` no mês corrente (miss = conta; cache hit não conta, já respeitado) e bloquear ao atingir a cota do plano. Alinhar copy da landing e do settings ao que for implementado.
- **Verificação:** Gerar exegeses até a cota e confirmar bloqueio exatamente no limite anunciado; confirmar que cache hit não consome cota.

### [SAAS-005] "Excluir conta" não exclui a conta nem expurga dados; promessa de "30 dias" sem job
- **Severidade:** P1
- **Status:** Aberto
- **Local:** `src/lib/profile/actions.ts:189-203` (`deleteAccountAction`); UI em `src/components/settings/SettingsDeleteAccount.tsx:51-54`; ausência de cron confirmada (sem `vercel.json`/cron)
- **Evidência:** `deleteAccountAction` só faz soft-delete dos sermões e signOut: `await supabase.from("sermons").update({ deleted_at: ... }).eq("user_id", user.id); await supabase.auth.signOut();` (linhas 196-201). Não apaga o usuário de `auth.users`, nem o `profile`, nem `slides`, `series`, `courses`, `study_*`, `notes`, `sermon_exegeses`. A conta continua existente e o usuário pode logar de novo. A UI promete "Seus sermões serão arquivados por 30 dias e depois removidos" (`SettingsDeleteAccount.tsx:51-54`), mas não existe cron/job de expurgo (nenhum `vercel.json`/`cron` no repo; `deleted_at` nunca é varrido). Contraste: `deleteUserAction` (admin) faz hard-delete via Auth Admin API (`admin/users.ts:238-248`) — o self-service não.
- **Impacto:** Violação de expectativa e de LGPD (direito à eliminação). Dados pessoais permanecem indefinidamente; a "exclusão" é enganosa. Bloqueia conformidade necessária para cobrar.
- **Correção:** 1) `deleteAccountAction` deve, via service_role, apagar o usuário em `auth.users` (cascade limpa `profiles` por FK `on delete cascade`, `001_profiles.sql:6`) OU marcar `profiles` para expurgo agendado. 2) Se optar por janela de 30 dias, criar job agendado (Supabase scheduled function / cron) que hard-deleta contas marcadas há >30 dias e purga `sermons.deleted_at` e demais tabelas do usuário. 3) Apagar também objetos no bucket `sermon-slides/{user_id}/`. 4) Registrar a operação em audit trail (SAAS-006).
- **Verificação:** Excluir conta de teste; confirmar que login subsequente falha e que, após a janela, `auth.users`/`profiles`/`sermons`/slides do usuário sumiram do banco e do Storage.

### [SAAS-006] Sem trilha de auditoria para operações sensíveis
- **Severidade:** P1
- **Status:** Aberto
- **Local:** Ausência global — nenhuma migration cria `audit_log`/`activity_log` (32 migrations, `INVENTARIO.md:134-142`). Operações sensíveis sem registro: `src/lib/admin/users.ts` (`deleteUserAction:224`, `updateUserRoleAction:114`, `setUserActiveAction:177`, `updateUserPlanAction:143`), `src/lib/profile/actions.ts:189` (`deleteAccountAction`), exclusão/arquivamento de sermão (`017_archive_sermons.sql`)
- **Evidência:** Nenhuma tabela de auditoria existe. As actions administrativas alteram papel, plano, ativação e apagam usuários sem gravar quem/o quê/quando/valor anterior. A referência do domínio (`09-saas-produto.md:29-34`) marca ausência de audit trail como P1 e exige cobertura de exclusão, mudança de permissão, alteração de billing e exportação.
- **Impacto:** Operações destrutivas e sensíveis (deleção de usuário, promoção a admin, mudança de plano, desativação, exclusão de conta) são irrastreáveis. Impossível investigar incidente, contestar cobrança ou provar conformidade — risco operacional e legal para um SaaS pago.
- **Correção:** Criar tabela append-only `audit_log` (`id`, `actor_id`, `action`, `target_type`, `target_id`, `before jsonb`, `after jsonb`, `ip`, `created_at`), RLS: só admin lê, sem update/delete via app (revoke), insert só via service_role. Inserir uma linha em cada action de `admin/users.ts`, em `deleteAccountAction`, em `updatePlanAction`/webhook de billing, e na exclusão/arquivamento de sermão.
- **Verificação:** Executar cada operação sensível e confirmar 1 linha imutável correspondente em `audit_log` com actor/target/before/after; tentar `update`/`delete` na tabela via app e confirmar negação.

### [SAAS-007] Zero instrumentação de produto (analytics/eventos) — impossível operar o SaaS
- **Severidade:** P1
- **Status:** Aberto
- **Local:** Ausência global — `package.json:12-48` (nenhuma lib de analytics); nenhum evento de funil no código
- **Evidência:** `package.json` não traz `@vercel/analytics`, `posthog-js`, `mixpanel`, `plausible`, `segment` nem equivalente. `grep -rilE "posthog|mixpanel|segment|amplitude|plausible|gtag|analytics|track\("` só retorna falsos positivos (substring "track" em texto). Não há captura de eventos de ativação (conta criada, primeiro sermão, primeira apresentação, upgrade) nem de retenção. Os únicos dados são custo de exegese (`admin/ai-queries.ts`) e leads em `signup_interests`.
- **Impacto:** Sem medir conversão, ativação, engajamento e churn, não há como operar comercialmente nem justificar preço/roadmap. Cega a gestão do produto.
- **Correção:** Adicionar uma camada de analytics (ex.: PostHog self-host — combina com o alvo VPS/Docker do CLAUDE.md — ou `@vercel/analytics` no curto prazo). Instrumentar eventos-chave: `signup_interest_submitted`, `account_created`, `first_sermon_created`, `sermon_presented`, `export_used`, `plan_changed`, `ai_exegesis_generated`. Definir métricas de ativação (time-to-first-sermon) e retenção.
- **Verificação:** Disparar cada evento em ambiente de teste e confirmar recebimento no painel de analytics; validar um funil registro→primeiro sermão.

### [SAAS-008] Sem Termos de Uso e Política de Privacidade (obrigatório para cobrar/LGPD)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** Ausência de páginas (`find src/app -iname "*term*" -o -iname "*privac*"` → vazio); footer `src/app/(public)/page.tsx:875-913`; checkbox de termos sem destino em `src/lib/supabase/actions.ts:31-34`
- **Evidência:** Não existe rota `/termos` nem `/privacidade`. O footer da landing (linhas 888-907) linka só Modelos/Exegese/Perguntas/Preço/Entrar/Cadastro — nenhum link legal. O `registerSchema` exige `terms: z.literal("on")` (supabase/actions.ts:31-34), mas não há página de termos para o usuário ler. A "Política de privacidade" em `SettingsPlanForm.tsx:203-209` é só um parágrafo sobre descarte de dados da IA, não um documento.
- **Impacto:** Não é possível cobrar de forma conforme sem contrato/ToS e política de privacidade (LGPD art. 8/9). Bloqueio comercial e jurídico.
- **Correção:** Criar páginas públicas `/termos` e `/privacidade` (podem ser Server Components estáticos em `src/app/(public)/`), linká-las no footer da landing e no fluxo de aceite. Fazer o checkbox de aceite apontar para elas e registrar versão/data do aceite no perfil (para audit trail).
- **Verificação:** Páginas acessíveis sem auth; links no footer e no checkout; aceite registrado com timestamp.

### [SAAS-009] Modelo é single-user; sem organização/igreja/equipe (teto de ticket)
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `supabase/migrations/001_profiles.sql`, `003_sermons.sql` etc. — tudo escopado por `user_id`; ausência de tabela org (grep sem `organization/team/tenant/workspace`)
- **Evidência:** Todas as tabelas são por usuário individual (RLS `auth.uid() = id`/`user_id`). Não há `organizations`/`churches`/`teams`/`memberships`; não há compartilhamento de sermão/série entre usuários. O campo `denomination` (`001_profiles.sql:8`) é texto livre, não uma entidade. A landing e o CLAUDE.md posicionam o produto para igrejas ("denominação/organização"), mas a venda só pode ser por assinatura individual.
- **Impacto:** Ticket limitado a plano individual (R$ 19,90/39,90). Igreja com equipe pastoral não tem conta compartilhada nem gestão de assentos — teto de receita e barreira para o segmento com maior disposição a pagar.
- **Correção:** (roadmap, não hotfix) Avaliar modelo org/tenant: tabela `organizations` + `memberships(user_id, org_id, role)`, escopar sermões/séries opcionalmente por org, plano por org com assentos. Se a decisão for manter single-user no MVP, documentar explicitamente e ajustar a promessa comercial.
- **Verificação:** Decisão de produto registrada; se implementado, um usuário de uma org acessa recursos compartilhados da org e não de outra (teste de isolamento por org).

### [SAAS-010] Sem estados de assinatura / trial / expiração / dunning
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `supabase/migrations/022_plans.sql:7-9` (só `plan`, sem status); `src/components/settings/SettingsPlanForm.tsx:215-257` (placeholders)
- **Evidência:** `profiles.plan` é só `manuscrito|concilio`. Não há `status` (active/trialing/past_due/canceled), `trial_ends_at`, `current_period_end` nem histórico. A UI "Próxima cobrança" diz "A cobrança começa quando sairmos do período de lançamento" (`SettingsPlanForm.tsx:231-234`) — não há máquina de estados. A referência do domínio exige tratamento de inadimplência (graça→suspenso→cancelado) (`09-saas-produto.md:16-17`).
- **Impacto:** Quando o billing existir, não há como suspender inadimplente nem preservar acesso de quem está em dia — cliente inadimplente usando de graça ou pagante cortado indevidamente.
- **Correção:** Modelar estados de assinatura na tabela `subscriptions` (SAAS-001), refletir `status` na UX (banner de pagamento pendente, bloqueio de features pagas em `past_due` após janela de graça), e derivar entitlement do status. Implementar dunning acionado pelo webhook.
- **Verificação:** Simular pagamento falho no gateway sandbox e confirmar transição para `past_due`→`suspended` com efeito no acesso; regularizar e confirmar reativação.

### [SAAS-011] `registerAction` (signup real) órfão — nenhum form o usa; risco de config de Auth
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/lib/supabase/actions.ts:106-147` (`registerAction`, faz `supabase.auth.signUp`); `src/app/auth/register/page.tsx:16` e `src/app/(public)/page.tsx:139` usam `RegisterForm`, que é form de interesse (`src/components/auth/RegisterForm.tsx:1-5,36-37` → `submitInterestAction`)
- **Evidência:** O produto é "por convite" (`RegisterForm.tsx:1-5`; `013_user_roles.sql:2-3`: "signup público desligado no Auth"). Mas `registerAction` continua exportado e cria conta real via `supabase.auth.signUp` (linhas 124-128) — sem nenhuma UI o chamando. Se o signup do Supabase Auth estiver LIGADO no projeto, existe um caminho fora do fluxo curado (chamada direta à Server Action ou reativação de um form) que cria conta grátis, a qual poderia se auto-promover a Concílio (SAAS-002).
- **Impacto:** Superfície morta com risco de auto-cadastro fora da curadoria + acoplada ao bypass do SAAS-002. Baixa probabilidade (nenhum form chama), mas contorna o modelo de acesso fechado se a config do Auth permitir.
- **Correção:** Remover `registerAction` (e `loginSchema/registerSchema` órfãos, se aplicável) ou protegê-lo atrás de token de convite validado no servidor. Verificação manual (não visível no repo): confirmar no painel Supabase → Auth → Providers que "Enable email signups" está DESLIGADO no projeto de produção (`jzotuzxqekzymvcitxpq`, ver MEMORY).
- **Verificação:** `grep -rn "registerAction" src/` deve dar zero chamadas de UI; no painel Supabase, signup público desativado; tentativa de signup direto retorna erro do Auth.

### [SAAS-012] Sem exportação em massa dos dados do usuário (offboarding/portabilidade)
- **Severidade:** P3
- **Status:** Aberto
- **Local:** `src/app/api/sermons/export/route.ts:548-556` (exige `sermonId`); promessa em `src/app/(public)/page.tsx:614`
- **Evidência:** `/api/sermons/export` exige `sermonId` e exporta 1 manuscrito por vez (`querySchema` linha 27-30; consulta `.eq("id", sermonId)` linha 574). A FAQ da landing promete "baixar tudo se um dia decidir sair" (`page.tsx:614`), mas não há endpoint que empacote todos os sermões/séries/cursos/estudos/notas do usuário.
- **Impacto:** Portabilidade LGPD (art. 18) e promessa de marketing não atendidas; atrito para o usuário sair (e para conformidade ao cobrar).
- **Correção:** Criar `/api/account/export` que gera um arquivo (ZIP/JSON) com todos os dados do usuário (sermões, séries, cursos, study, notas, preferências), autenticado por `getUser()`. Linká-lo em Configurações → Conta.
- **Verificação:** Usuário com vários itens baixa o pacote e confere que contém todos os registros próprios e nenhum de terceiros.

### [SAAS-013] Onboarding/ativação fraco: saudação fixa, sem wizard, sem primeiro-valor guiado
- **Severidade:** P2
- **Status:** Aberto
- **Local:** `src/app/(app)/dashboard/page.tsx:79,164-175`; fluxo pós-login em `src/lib/supabase/actions.ts:64-104`
- **Evidência:** Após o admin criar a conta (`admin/users.ts:46`) e o usuário logar, `loginAction` redireciona para `/dashboard` (`supabase/actions.ts:103`). O dashboard exibe saudação hardcoded `<h1>Bom dia, Pastor</h1>` (dashboard/page.tsx:79) — ignora `profile.name` (o `loadData` nem busca o nome). O empty state é uma caixa tracejada "Você ainda não tem manuscritos" com botão (linhas 164-175). Não há wizard de boas-vindas, dado de exemplo, tour, nem checklist de ativação. Time-to-first-sermon depende do usuário achar "Novo manuscrito".
- **Impacto:** Ativação baixa: primeiro contato impessoal ("Pastor" fixo, mesmo para palestrantes/professores — contradiz o escopo do CLAUDE.md) e sem condução ao primeiro valor. Retenção inicial sofre.
- **Correção:** 1) Buscar e usar `profile.name` na saudação. 2) Adicionar onboarding leve: tela/modal de boas-vindas no primeiro acesso, ou checklist ("crie seu primeiro sermão", "escolha um modelo", "faça uma apresentação"). 3) Considerar sermão de exemplo (seed) por conta nova. 4) Ajustar copy para não presumir "Pastor".
- **Verificação:** Conta nova mostra nome real e um guia de primeiro uso; medir time-to-first-sermon via evento de analytics (SAAS-007).

## Cobertura
Itens do inventário relevantes ao domínio SaaS/Produto e veredito:

| Item do inventário | Arquivo | Veredito |
|---|---|---|
| Landing / preços / CTA / prova social / legal | `src/app/(public)/page.tsx` | Achado SAAS-008 (sem termos/privacidade); preços presentes mas decorativos (SAAS-001); sem depoimentos reais (TODO na SPEC) |
| Aba "Meu plano" / troca de plano | `src/components/settings/SettingsPlanForm.tsx` | Achado SAAS-001, SAAS-002, SAAS-004, SAAS-010 |
| Actions de perfil (plano, IA, exclusão) | `src/lib/profile/actions.ts` | Achado SAAS-002 (`updatePlanAction`), SAAS-005 (`deleteAccountAction`); `updateAISettingsAction` OK (gate concilio, linhas 99-112) |
| Rota de sugestão de IA | `src/app/api/ai/suggest/route.ts` | Achado SAAS-003 |
| Pipeline de exegese (cap de custo) | `src/lib/exegesis/actions.ts` | Cap em USD OK (208-227), mas Achado SAAS-004 (divergente do anunciado) |
| Config global de IA (preços/cap) | `supabase/migrations/024_ai_settings.sql`; `src/lib/admin/ai.ts` | OK — cap e preços existem; default 5 USD |
| Painel de custo de IA (atribuição) | `src/lib/admin/ai-queries.ts` | OK para exegese; não cobre `/api/ai/suggest` (SAAS-003) |
| Gestão de usuários (papéis/plano/ativação/deleção) | `src/lib/admin/users.ts` | Gating de papel OK (super_admin para admin, 128); Achado SAAS-006 (sem audit) |
| Queries admin / detecção de admin | `src/lib/admin/queries.ts` | OK (`isCurrentUserAdmin`) |
| Migration de planos | `supabase/migrations/022_plans.sql` | Achado SAAS-001, SAAS-010 (só coluna, sem status/billing) |
| Migrations de papéis | `013_user_roles.sql`, `031_rename_role_pastor_to_usuario.sql` | OK — papéis usuario/admin/super_admin, trigger `protect_role_column`; sem auto-promoção (default `usuario`) |
| Concílio auto-liga IA | `032_concilio_auto_enables_ai.sql` | Contexto de SAAS-002 (concilio ⇒ ai_enabled=true) |
| Ativação/desativação de conta | `027_user_is_active.sql`, `029_protect_is_active_service_role.sql` | OK — trigger protege `is_active`, login/middleware bloqueiam; sem audit (SAAS-006) |
| Exclusão de conta (UI) | `src/components/settings/SettingsDeleteAccount.tsx` | Achado SAAS-005 (promessa "30 dias" sem job) |
| Exportação de manuscrito | `src/app/api/sermons/export/route.ts` | OK por item; Achado SAAS-012 (sem export em massa) |
| Arquivo/lixeira de sermão | `017_archive_sermons.sql` | OK (soft delete + archive); sem expurgo agendado / sem audit |
| Registro / funil de interesse | `src/components/auth/RegisterForm.tsx`, `src/app/auth/register/page.tsx`, `src/lib/interests/actions.ts`, `016_signup_interests.sql` | Funil de interesse OK (cooldown 60s, captura IP/UA); Achado SAAS-011 (`registerAction` órfão) e SAAS-013 (onboarding) |
| Onboarding pós-login / dashboard | `src/app/(app)/dashboard/page.tsx`, `src/lib/supabase/actions.ts` | Achado SAAS-013 |
| Multi-tenancy (modelo por usuário vs org) | `001_profiles.sql` + tabelas por `user_id` | Achado SAAS-009 (single-user; sem org) — RLS por `auth.uid()` (JWT) está correta, sem tenant vindo do client |
| Audit trail (global) | — | Achado SAAS-006 (inexistente) |
| Instrumentação de produto (global) | `package.json` | Achado SAAS-007 (inexistente) |
| Termos/Privacidade (global) | — | Achado SAAS-008 (inexistentes) |
