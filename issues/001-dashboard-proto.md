# Issue 001 — Dashboard UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /dashboard
**Depende de:** 023
**Prioridade:** P0

---

## O Que Fazer

Criar o protótipo visual do dashboard — layout, componentes e estados visuais
sem dados reais (usar mocks hardcoded).

## Componentes Envolvidos

- `src/app/(app)/dashboard/page.tsx` — Página do dashboard (mock)
- `src/app/(app)/layout.tsx` — Layout com sidebar + header
- `src/components/shared/AppSidebar.tsx` — Navegação lateral
- `src/components/shared/AppHeader.tsx` — Header com avatar e nome
- `src/components/sermon/SermonCard.tsx` — Card de sermão na listagem
- `src/components/shared/StatsCard.tsx` — Card de estatística

## Comportamentos (proto — apenas visual)

- Layout de duas colunas: sidebar fixa à esquerda + conteúdo à direita
- Sidebar: logo VOX, links de navegação, avatar do usuário no rodapé
- Header: título da página + avatar com dropdown (logout)
- Grid de stats: "Total de Sermões", "Último Sermão", "Em Série"
- Seção "Sermões Recentes": 5 cards mockados
- FAB "Novo Sermão" no canto inferior direito (mobile) ou botão no header (desktop)
- Responsivo: sidebar vira drawer no mobile

## Critério de Aceite

- [ ] Layout sidebar + conteúdo funcionando no desktop
- [ ] Sidebar vira drawer no mobile (hamburger)
- [ ] 3 cards de stats renderizando com dados mock
- [ ] 5 SermonCards renderizando com dados mock
- [ ] FAB/botão "Novo Sermão" visível
- [ ] Links da sidebar navegam para as rotas corretas
- [ ] Sem erros de console
- [ ] Responsivo em 375px (mobile) e 1280px (desktop)

## Notas de Implementação

- Usar shadcn/ui `Sheet` para o drawer mobile da sidebar
- Mocks: criar array de 5 sermões fictícios com título, referência, framework, data
- SermonCard deve exibir: título, referência bíblica, framework (badge colorido), data, tags
- Design system ainda pendente — usar cores placeholder do Tailwind (azul padrão)
  que serão substituídas pelas variáveis CSS do design system na issue 031+
- AppSidebar deve aceitar prop `onClose` para fechar o drawer mobile

### Mock de sermon para proto
```typescript
const MOCK_SERMONS = [
  {
    id: '1',
    title: 'A Graça Suficiente',
    bible_ref: '2 Coríntios 12:9',
    framework: 'expositivo',
    status: 'pronto',
    tags: ['graça', 'suficiência'],
    preached_at: '2026-05-11'
  },
  // ... mais 4
]
```

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (Next.js + Tailwind + shadcn/ui configurados)

### Passos

**1. Criar layout autenticado com sidebar**
Criar `src/app/(app)/layout.tsx`:
- Renderiza `<AppSidebar>` fixo à esquerda (lg+) e `<AppHeader>` no topo
- No mobile, encapsula sidebar num `<Sheet>` controlado por estado

**2. Criar AppSidebar**
Criar `src/components/shared/AppSidebar.tsx`:
- Props: `onClose?: () => void`
- Links: Dashboard `/dashboard`, Sermões `/sermons`, Importar `/import`, Configurações `/settings`
- Rodapé: avatar placeholder + nome mockado "Pastor João"

**3. Criar AppHeader**
Criar `src/components/shared/AppHeader.tsx`:
- Prop `title: string`
- Botão hambúrguer (mobile) que abre o Sheet da sidebar
- DropdownMenu à direita: avatar + "Sair" (só visual no proto)

**4. Criar StatsCard**
Criar `src/components/shared/StatsCard.tsx`:
- Props: `label: string`, `value: string | number`, `icon?: ReactNode`
- Usa `<Card>` do shadcn com layout flex

**5. Criar SermonCard**
Criar `src/components/sermon/SermonCard.tsx`:
- Props: objeto com `title`, `bible_ref`, `framework`, `status`, `tags`, `preached_at`
- Badge colorido por framework (usar `bg-blue-100` placeholder)
- Exibe data formatada em pt-BR

**6. Criar página do dashboard**
Criar `src/app/(app)/dashboard/page.tsx`:
- Array `MOCK_SERMONS` com 5 itens conforme spec
- Grid de 3 `<StatsCard>` (bento assimétrico: 2+1)
- Lista de 5 `<SermonCard>`
- Botão flutuante "Novo Sermão" → `href="/sermons/new"`

### Como Verificar
- `npm run dev` → acessar `/dashboard` sem erros de console
- Redimensionar para 375px: sidebar some, botão hambúrguer aparece, Sheet abre ao clicar
- Todos os 5 cards de sermão visíveis com dados mock corretos
- Links da sidebar navegam para as rotas certas
