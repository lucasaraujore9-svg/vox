# Issue 015, Biblioteca de Templates/Frameworks UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /templates
**Depende de:** 023
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual da biblioteca pública de frameworks homiléticos,
uma página exploratória onde o usuário aprende sobre cada framework antes de usá-lo.

## Componentes Envolvidos

- `src/app/(public)/templates/page.tsx`, página pública (sem autenticação)
- `src/components/templates/FrameworkCard.tsx`, card expandível do framework
- `src/components/templates/FrameworkDetail.tsx`, modal com detalhes completos

## Comportamentos (proto, dados mockados de design-system/vox/data.js)

### Header da página
- Título: "Frameworks Homiléticos" Fraunces 600 36px
- Subtítulo: "Escolha o modelo que melhor se encaixa na sua mensagem"
- Breadcrumb: "VOX / Frameworks" (página pública, acessível sem login)
- CTA: "Criar sermão →" (Forest Deep, redireciona para `/auth/register` se não autenticado)

### Grid de FrameworkCards (bento assimétrico, não 3 iguais em linha)
6 frameworks dos dados de `design-system/vox/data.js`:

**Cada FrameworkCard:**
- Barra lateral colorida com `var(--fw-{id})` (cor do framework)
- Badge do nome: Fraunces 600 18px
- Tagline: Geist Italic 14px Slate
- Descrição: Geist 14px (3 linhas truncadas)
- Mini-estrutura: lista de blocos em chips (ex: "Texto Bíblico → Contexto → Ponto Principal")
- Botão "Ver detalhes" ghost
- Hover: sombra card-hover + cursor pointer

**Layout bento:**
- Expositivo: card grande (2 colunas)
- Narrativo: card médio
- Temático: card médio
- Tópico, Textual, Livre: cards compactos em linha

### FrameworkDetail (modal ao clicar "Ver detalhes")
- Título + tagline do framework
- Descrição completa
- Quando usar: lista de cenários (ex: "Use quando tiver uma única passagem clara")
- Estrutura completa: lista de blocos com ícone colorido
- Exemplo de sermão: título + referência bíblica de um sermão real usando esse framework
- CTA: "Criar sermão com este framework →"

## Critério de Aceite

- [ ] 6 cards renderizando com cores corretas dos frameworks
- [ ] Layout bento assimétrico (não grid uniforme)
- [ ] Modal "Ver detalhes" abre ao clicar
- [ ] Mini-estrutura de blocos visível em cada card
- [ ] CTA "Criar sermão" visível
- [ ] Página acessível sem autenticação
- [ ] Responsivo: 2 col desktop, 1 col mobile

## Notas de Implementação

- Reutilizar `VOX_DATA.FRAMEWORKS` de `design-system/vox/data.js` como constante TypeScript
- `FrameworkBadge` de `design-system/vox/primitives.jsx` como referência
- Cores: `var(--fw-expositivo)`, `var(--fw-textual)`, etc. (já definidas em `colors_and_type.css`)
- Modal: shadcn `Dialog` com conteúdo rico

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (shadcn/ui disponível, fontes configuradas)

### Passos

**1. Criar constante de frameworks**
Criar `src/lib/frameworks/data.ts`:
- Exportar `FRAMEWORKS` com todos os 6 frameworks (adaptado de `design-system/vox/data.js`)
- Incluir: id, name, tagline, description, outline (array de blocos), color, whenToUse

**2. Criar FrameworkCard**
Criar `src/components/templates/FrameworkCard.tsx`:
- `borderLeft: 4px solid var(--fw-{id})`
- Badge, tagline, descrição truncada, mini-chips de blocos
- Botão "Ver detalhes" → `onDetail()` callback

**3. Criar FrameworkDetail**
Criar `src/components/templates/FrameworkDetail.tsx`:
- shadcn `Dialog` com `ScrollArea` para conteúdo longo
- Blocos da estrutura: cada bloco com ícone colorido e nome

**4. Criar página /templates**
Criar `src/app/(public)/templates/page.tsx`:
- `useState<string | null>(null)` para framework selecionado
- Grid com classes CSS para layout bento
- `FrameworkDetail` condicional

**5. Adicionar link na navegação pública**
Editar landing page e AppSidebar:
- Link "Frameworks" no sidebar (para usuários autenticados)
- Link no rodapé da landing page

### Como Verificar
- `/templates` acessível sem login (verificar que middleware não bloqueia)
- 6 cards renderizando com cores corretas dos frameworks
- Modal abre e fecha corretamente
- CTA redireciona para `/auth/register` se não autenticado, `/sermons/new` se autenticado
