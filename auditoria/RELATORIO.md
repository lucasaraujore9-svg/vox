# RELATÓRIO DE AUDITORIA — VOX

**Data:** 2026-08-12 · **Commit base:** `2cdb419` · **Branch:** `main` (árvore limpa)
**Escopo:** 11 domínios · cobertura total, sem amostragem
**Base de cobertura:** [`INVENTARIO.md`](INVENTARIO.md) · **Achados detalhados:** [`achados/`](achados/)

---

## Sumário executivo

O VOX é um **produto bem construído com uma camada de negócio ausente**. A engenharia
é acima da média para um projeto deste porte: `tsc --noEmit` e `next build` passam com
zero erro (o `eslint` não — ver COD-014); RLS está habilitada e escopada por `auth.uid()` nas 17 tabelas;
`getUser()` é usado em todo contexto de servidor (zero `getSession()`); a `service_role`
nunca chega ao cliente; nenhum segredo foi commitado no histórico do git; e as bibliotecas
pesadas (pdfjs, sharp, jspdf, mammoth, openai) estão corretamente fora do bundle do browser.

**Não há vazamento de dados entre usuários.** Essa era a pergunta P0 clássica e a resposta,
verificada policy a policy nas 32 migrations e action a action nos 16 módulos `"use server"`,
é negativa.

O que impede o VOX de ser vendável hoje são **cinco P0**, e nenhum deles é sobre a qualidade
do código do produto:

| # | P0 | Natureza | Status |
|---|---|---|---|
| **SEG-012** | `pdfjs-dist` vulnerável processando PDF do usuário no processo que carrega a `service_role` | Segurança | ✅ **Corrigido** — upgrade para 6.2.108 |
| **LGPD-001** | Não existem Termos de Uso nem Política de Privacidade | Legal | ✅ **Corrigido** — `/termos` e `/privacidade` publicados |
| **LGPD-002** | "Excluir conta" não exclui nada e promete ao usuário uma remoção que não acontece | Legal | ✅ **Corrigido** — exclusão definitiva + cópia honesta |
| **SAAS-002** | O plano pago é auto-atribuível: o usuário se promove a Concílio de graça em Configurações | Negócio | Aberto |
| **SAAS-001** | Não existe nenhum meio de cobrança — zero gateway de pagamento | Negócio | Aberto |

Dito de forma direta: **o produto funciona, mas não pode cobrar, não pode ser cobrado com
segurança jurídica, e tem um caminho de comprometimento total da base a partir de um upload
de PDF.** Os três problemas são resolvíveis e nenhum exige reescrever o produto.

### Notas por domínio

| Domínio | P0 | P1 | P2 | P3 | Total | Nota | Leitura |
|---|--:|--:|--:|--:|--:|:--:|---|
| [Segurança](achados/seguranca.md) | 1 | 1 | 6 | 4 | 12 | 5.5 | Base sólida, mas um P0 de dependência |
| [Banco / RLS](achados/banco.md) | 0 | 2 | 5 | 3 | 10 | **7.0** | Melhor domínio do sistema |
| [Código](achados/codigo.md) | 0 | 1 | 8 | 4 | 13 | 6.5 | Sólido; falta rede de segurança de erro |
| [Frontend / UX](achados/frontend.md) | 0 | 1 | 4 | 3 | 8 | 6.5 | Só 1 link 404 em todo o app |
| [API / Integrações](achados/api.md) | 0 | 2 | 4 | 5 | 11 | 6.0 | Sem timeout em nenhuma chamada externa |
| [Performance](achados/performance.md) | 0 | 3 | 5 | 4 | 12 | 6.5 | Caminho do púlpito é o mais frágil |
| [Observabilidade](achados/observabilidade.md) | 0 | 3 | 5 | 0 | 8 | 3.0 | Cego: sem Sentry, sem métrica, sem alerta |
| [DevOps](achados/devops.md) | 0 | 3 | 5 | 3 | 11 | 5.0 | Sem CI; portão existe mas ninguém roda |
| [SaaS / Produto](achados/saas.md) | 2 | 5 | 4 | 2 | 13 | **2.0** | Camada de negócio ausente |
| [LGPD](achados/lgpd.md) | 2 | 3 | 5 | 3 | 13 | **2.0** | Bloqueante para cobrar |
| [Testes / QA](achados/testes.md) | 0 | 3 | 5 | 2 | 10 | **2.0** | Zero testes em 202 arquivos |
| **TOTAL** | **5** | **27** | **56** | **33** | **121** | **5.0** | |

### Portão Zero-Erro — baseline medido

| Etapa | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erros |
| `npx eslint .` | ❌ **exit 1 — 93 erros, 98 avisos** (18 erros em `src/`) — ver COD-014 |
| `npm run build` | ✅ 42 rotas compiladas |
| `npm test` | ❌ **script não existe; zero testes no repositório** |
| `npm audit --omit=dev` | ⚠️ 15 vulnerabilidades (9 high) — ver SEG-011 |

> **Correção de método.** A primeira versão deste relatório afirmava "lint 0 erros". Estava errado:
> o comando rodou com pipe (`npx eslint . | tail`) e o `$?` capturado era o do `tail`, não o do
> eslint. Na medição correta o lint **falha**. Detalhe e decomposição em COD-014.

O portão está **incompleto por construção**: sem runner de teste, a etapa 5 nunca pode ficar
verde. E sem CI (OPS-001), nem as etapas que existem são executadas antes do deploy — foi
exatamente assim que 93 erros de lint se acumularam sem ninguém notar.

---

## O que está genuinamente bom

Vale registrar, porque é o que torna o resto corrigível:

- **Isolamento multi-tenant correto.** RLS habilitada nas 17 tabelas, policies escopadas por
  `auth.uid()`, triggers protegendo `role` (013) e `is_active` (027/029), funções
  `SECURITY DEFINER` com `search_path` fixo e `EXECUTE` revogado do público (015).
- **Autorização de admin server-side.** As 4 páginas `/admin/**` chamam `isCurrentUserAdmin()`
  no RSC e redirecionam — não é gating só de UI. Promoção a admin restrita a `super_admin`.
- **Bundle disciplinado.** Nenhuma das libs pesadas vaza para o browser (verificado por grep
  em `.next/static/chunks`: 0 ocorrências de pdfjs/jspdf/mammoth/sharp/openai).
- **Formulários corretos.** `useFormStatus`/`useTransition` com `disabled` no pending,
  `autoComplete` e `aria-invalid` adequados, confirmação por digitação na exclusão de conta.
- **Design system respeitado no essencial.** Zero `#000`, zero `Inter`, zero palavras banidas.
- **Higiene de segredos.** `.env.local` ignorado e nunca commitado; nenhum valor de segredo
  no histórico; `DEPLOY_NOTES.md` (que contém credenciais) está no `.gitignore` e nunca foi
  versionado.

---

## Backlog priorizado

Ordenado por risco × esforço. Os P0 são pré-requisito de qualquer lançamento comercial.

### Bloco 1 — P0 (fazer antes de qualquer outra coisa)

| Ordem | ID | O quê | Esforço |
|--:|---|---|---|
| 1 | **SEG-012** | `isEvalSupported: false` no `getDocument` (1 linha) + subir `pdfjs-dist` para ≥6.2.108 | Baixo → Médio |
| 2 | **SAAS-002** | Remover `updatePlanAction`; trigger `protect_plan_column` no Postgres | Baixo |
| 3 | **LGPD-001** | Publicar `/termos` e `/privacidade`, linkar no footer e no aceite | Baixo |
| 4 | **LGPD-002** | `deleteAccountAction` apagar de verdade (Auth + tabelas + Storage) ou job de expurgo | Médio |
| 5 | **SAAS-001** | Integrar gateway (Stripe/Asaas) + tabela `subscriptions` + webhook idempotente | Alto |

**Observação sobre a ordem:** SAAS-002 vem antes de SAAS-001 de propósito. Fechar o
auto-upgrade é barato e, sem isso, integrar billing não adianta — o paywall continua
contornável por um clique em Configurações.

### Bloco 2 — P1 que travam operação (27 no total; estes são os que eu priorizaria)

| ID | O quê | Por quê agora |
|---|---|---|
| **SEG-001** | INSERT aberto em `chapter_exegeses` permite envenenar o cache global de exegeses | Integridade cross-tenant + bypass de plano |
| **API-002** | Nenhuma chamada externa (OpenAI, API bíblica) tem timeout | Upstream lento pendura handler e spinner |
| **API-001 / SAAS-003** | `/api/ai/suggest` sem cap de custo e sem registro de uso | Conta de OpenAI aberta, invisível no `/admin/ai` |
| **OBS-001** | Zero error tracking (sem Sentry) | Erro de domingo de manhã ninguém fica sabendo |
| **FE-001 / COD-001** | Zero `error.tsx`/`not-found.tsx`/`global-error.tsx` | Falha do Supabase = tela branca do Next, sem marca |
| **PERF-001** | Slides sem preload do próximo, full-res via `background-image` | É o púlpito, em 4G, na frente da congregação |
| **PERF-002** | Tela de apresentação sem fallback offline | Idem — o pior momento possível para falhar |
| **QA-001** | Sem teste de isolamento por usuário | `getSermon`/`listSermons` dependem 100% da RLS |
| **OPS-001** | Sem CI — Portão Zero-Erro não roda antes do deploy | Commit quebrado vai a produção sem barreira |
| **OPS-002 / SEG-006** | Middleware **fail-open**: sem env, libera todas as rotas | Deploy com env errada sobe inseguro e silencioso |
| **DB-002** | (= SEG-001, visto pelo banco) | — |
| **DB-001** | FK `sermons.series_id` sem índice | Seq scan na listagem principal |

### Bloco 3 — P2/P3 (89 achados)

Agrupados por tema, com os representativos:

- **Robustez:** COD-002 (erros do Supabase engolidos em ~7 actions, incluindo mudança de
  papel e exclusão de conta), COD-005 (5+ formatos de retorno de Server Action).
- **Custo/abuso:** SEG-002 (`/api/bible/*` público sem rate limit, apesar do comentário
  afirmar que há), SEG-003 (`retryFailedGroupsAction` sem gate de plano), COD-003/OPS-004
  (rate-limit em `Map` de memória, inócuo em serverless e com vazamento de memória).
- **Segurança de borda:** SEG-005 (nenhum header: CSP, HSTS, X-Frame-Options),
  SEG-011 (`sharp`/libvips com CVEs processando upload não confiável; `shadcn` como
  dependency de produção arrastando pacotes high).
- **Migração ⚠️ Vercel→Swarm:** OPS-003 (`output: 'standalone'` ausente), OPS-005 (sem
  Dockerfile/stack.yml/`.dockerignore`/`/api/health`), OPS-006 (`maxDuration` é
  Vercel-specific; upload de 300s morre no timeout do Traefik), OPS-007 (`sharp` e
  `@napi-rs/canvas` exigem base glibc, não alpine).
- **Produto:** FE-003 (Cursos e Estudo estão no menu principal mas são telas 100% mock),
  SAAS-013 (dashboard saúda "Bom dia, Pastor" fixo, ignorando `profile.name` — e o produto
  também atende palestrantes e professores), SAAS-012 (sem exportação em massa).
- **Dívida honesta:** COD-006 — `src/lib/mocks/` guarda **configuração de produção**
  (frameworks homiléticos, tipos de bloco) importada por ~40 arquivos. Ninguém vê dado falso
  hoje, mas qualquer "limpeza de mocks antes de produção" quebra o app inteiro.

---

## Riscos que a auditoria **não** cobriu

Honestidade sobre os limites desta varredura:

1. **Estado real do banco em produção.** Os MCP servers `supabase` e `vercel` não estão
   autorizados nesta sessão. Tudo sobre RLS foi verificado **nas migrations do repositório**,
   não no projeto `jzotuzxqekzymvcitxpq` rodando. Se alguma policy foi alterada manualmente
   pelo dashboard, esta auditoria não veria.
2. **Configuração do Supabase Auth.** SAAS-011 depende de "Enable email signups" estar
   desligado no painel — não é verificável pelo repo.
3. **Backup/PITR** (DB-007) e **proteção de preview deployment** — configuração de dashboard.
4. **Comportamento em runtime.** Nada foi executado contra um ambiente rodando: sem
   credenciais Supabase, não dá para exercitar login, upload ou apresentação de fato.
5. **Responsivo real.** A análise de mobile foi por leitura de código (larguras fixas,
   `hidden md:*`), não por renderização em viewport de 375px.

---

## Recomendação

Se o objetivo é **vender**, a sequência que eu seguiria:

1. **Semana 1 — destravar o legal e o crítico.** SEG-012 (mitigação de 1 linha no mesmo dia),
   SAAS-002, LGPD-001, LGPD-002. São baratos e removem 4 dos 5 P0.
2. **Semana 2-3 — billing.** SAAS-001 é o item caro e não tem atalho: gateway, tabela
   `subscriptions`, webhook idempotente, entitlement derivado do pagamento, estados de
   assinatura (SAAS-010).
3. **Em paralelo, contínuo — a rede de segurança.** OPS-001 (CI rodando o portão),
   OBS-001 (Sentry), FE-001 (error boundaries) e os primeiros testes da lista de QA-001.
   Sem isso, cada correção acima entra sem prova e sem rede.

O produto em si — editor, frameworks homiléticos, apresentação, exegese, Bíblia — está
em estado bom o suficiente para ser vendido. É a infraestrutura comercial e legal em volta
dele que ainda não existe.

---

## Próximos comandos

- `/corrigir seguranca P0` — começa pelo SEG-012
- `/corrigir saas P0` — SAAS-002 e depois SAAS-001
- `/corrigir lgpd P0` — LGPD-001 e LGPD-002
- `/verificar tudo` — re-audita e roda o Portão Zero-Erro completo
