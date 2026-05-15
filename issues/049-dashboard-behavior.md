# Issue 049 — Dashboard: Behavior (Dados Reais)

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /dashboard
**Depende de:** 001, 030, 045
**Prioridade:** P1

---

## O Que Fazer

Conectar o protótipo do dashboard (001) aos dados reais do Supabase:
estatísticas reais do usuário, sermões recentes com dados do banco,
e ações rápidas conectadas ao sistema.

## Componentes Envolvidos

- `src/app/(app)/dashboard/page.tsx` — Server Component com queries paralelas
- `src/components/dashboard/StatsCard.tsx` — cards de estatística (dados reais)
- `src/components/dashboard/RecentContent.tsx` — lista de conteúdos recentes
- `src/components/dashboard/QuickActions.tsx` — ações rápidas contextuais
- `src/lib/supabase/queries/dashboard.ts` — queries otimizadas do dashboard

## Comportamentos

### Queries paralelas (Server Component)
```typescript
const [stats, recentContent, activeSeries] = await Promise.all([
  getDashboardStats(supabase, userId),
  getRecentContent(supabase, userId, 5),
  getActiveSeries(supabase, userId)
])
```

### StatsCards — dados reais
- **Total de conteúdos:** `SELECT COUNT(*) FROM sermons WHERE user_id = ? AND deleted_at IS NULL`
- **Último pregado:** `SELECT preached_at FROM sermons WHERE user_id = ? AND preached_at IS NOT NULL ORDER BY preached_at DESC LIMIT 1`
- **Em preparação:** `SELECT COUNT(*) WHERE status = 'rascunho'`
- **Séries ativas:** `SELECT COUNT(*) FROM series WHERE user_id = ? AND deleted_at IS NULL`
- **Total de cursos:** `SELECT COUNT(*) FROM courses WHERE user_id = ? AND deleted_at IS NULL`
- **Horas de estudo:** `SELECT SUM(progress/100 * estimated_hours) FROM study_sessions JOIN study_modules`

### Conteúdos recentes
- 5 mais recentes por `updated_at`
- Mostra: título, content_type badge, framework/slides badge, data relativa ("há 2 dias")
- Clique → `/sermons/{id}`

### Série em andamento
- Série com mais sermões em rascunho (sugestão de continuidade)
- Exibe: nome da série, progresso "3/8 sermões prontos"
- CTA: "Continuar série →"

### Estudo em andamento
- Módulo de estudo com maior progresso (mas não 100%)
- Exibe: nome do módulo, barra de progresso, "Sessão 3 de 8"
- CTA: "Continuar estudo →"

### Quick Actions contextuais
- Adapta sugestões com base no contexto:
  - Se tem série ativa → "Adicionar sermão à série X"
  - Se tem módulo em andamento → "Continuar: [Módulo]"
  - Se tem rascunho antigo (> 7 dias) → "Retomar: [Título]"
  - Default → "Criar novo sermão"

### Estado inicial (usuário novo)
- Sem conteúdo: tela de boas-vindas com 3 CTAs principais
  - "Criar primeiro sermão" (Forest Deep)
  - "Explorar frameworks" (outline)
  - "Começar um estudo" (outline)
- Sem mostrar cards de stats zerados — iria desanimar o usuário

## Critério de Aceite

- [ ] Stats reais carregados (sem mock)
- [ ] 5 conteúdos recentes reais na lista
- [ ] Data relativa correta ("há 3 dias", "ontem", "hoje")
- [ ] Série em andamento exibida com progresso correto
- [ ] Módulo de estudo em andamento exibido
- [ ] Quick Actions contextuais (pelo menos 2 variações)
- [ ] Estado de boas-vindas para usuário sem conteúdo
- [ ] Tempo de carregamento < 800ms (queries paralelas)
- [ ] Acesso apenas com autenticação (middleware garante)

## Plano de Implementação

### Pré-requisitos
- Issue 001 concluída (dashboard visual pronto)
- Issue 030 concluída (sermões CRUD funciona)
- Issue 045 concluída (séries existem)

### Passos

**1. Criar queries do dashboard**
Criar `src/lib/supabase/queries/dashboard.ts`:
- `getDashboardStats(supabase, userId)` → múltiplos COUNTs em paralelo
- `getRecentContent(supabase, userId, limit)` → SELECT últimos N com JOINs mínimos
- `getActiveSeries(supabase, userId)` → série com mais rascunhos
- `getActiveStudy(supabase, userId)` → estudo com maior progresso < 100

**2. Atualizar dashboard page.tsx**
Editar `src/app/(app)/dashboard/page.tsx` (Server Component):
- `Promise.all([...queries])` para queries paralelas
- Detectar estado novo (sem conteúdo) → renderizar `WelcomeScreen`
- Passar dados para componentes client

**3. Criar StatsCard com dados reais**
Editar `src/components/dashboard/StatsCard.tsx`:
- Receber valor como prop (não calcular no componente)
- Suspense placeholder: shadcn `Skeleton`

**4. Criar RecentContent**
Criar `src/components/dashboard/RecentContent.tsx`:
- Lista de 5 itens com data relativa (usar `formatDistanceToNow` do date-fns)
- Badge por content_type (Sermão/Palestra/Aula)

**5. Criar WelcomeScreen**
Criar `src/components/dashboard/WelcomeScreen.tsx`:
- Exibido quando não há conteúdo
- 3 CTAs: Criar sermão, Explorar frameworks, Começar estudo

**6. Criar QuickActions contextuais**
Criar `src/components/dashboard/QuickActions.tsx`:
- Lógica de prioridade: série > estudo > rascunho antigo > default
- Renderiza 1-2 sugestões relevantes

### Como Verificar
- Dashboard carrega < 800ms (Network tab)
- Criar um sermão → aparece em "Recentes" após reload
- Marcar sermão como pregado (`preached_at`) → "Último pregado" atualiza
- Usuário novo vê WelcomeScreen, não stats zerados
- Iniciar estudo → progresso aparece no card de estudo
