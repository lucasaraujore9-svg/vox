# Issue 048 — Biblioteca de Templates/Frameworks: Behavior

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /templates
**Depende de:** 015, 023
**Prioridade:** P2

---

## O Que Fazer

Conectar a biblioteca de templates (proto 015) a dados reais e implementar
o fluxo de "usar template" — selecionar um framework e ir direto para a
criação de conteúdo com aquele framework pré-selecionado.

## Componentes Envolvidos

- `src/app/(public)/templates/page.tsx` — Server Component (dados estáticos)
- `src/lib/frameworks/data.ts` — constantes de frameworks (sem DB — dados hardcoded)
- `src/app/api/templates/route.ts` — (opcional) API para templates customizados futuros

## Comportamentos

### Dados dos frameworks
Os frameworks são estáticos (hardcoded) — não vêm do banco no MVP.
A fonte de verdade é `src/lib/frameworks/data.ts` (criada na issue 015).

### Fluxo "Usar este framework" (autenticado)
1. Usuário clica "Criar sermão com este framework →"
2. Sistema redireciona para `/sermons/new?framework={frameworkId}&content_type=sermão`
3. Wizard de criação pula o FrameworkPicker (pré-selecionado) e vai direto para metadados

### Fluxo para não-autenticados
1. Usuário clica "Criar sermão →" sem estar logado
2. Redireciona para `/auth/register?redirect=/sermons/new?framework={frameworkId}`
3. Após cadastro, retoma o fluxo com framework pré-selecionado

### Integração com /sermons/new
- `searchParams.framework` presente → pula o FrameworkPicker
- Mostra confirmação: "Usando framework: Expositivo" com opção de trocar

### Contagem de uso (futuro)
- Placeholder: a tabela `sermons` já tem campo `framework`
- Pode-se calcular "frameworks mais usados" via query `GROUP BY framework`
- Não implementar no MVP — apenas documentar para fase 2

### SEO (página pública)
- Metadata estática por framework para indexação
- Open Graph com nome e tagline do framework

## Critério de Aceite

- [ ] Página `/templates` funciona sem autenticação
- [ ] "Usar este framework" (autenticado) redireciona com `?framework=` pré-selecionado
- [ ] "Usar este framework" (não autenticado) redireciona para `/auth/register`
- [ ] Wizard em `/sermons/new` com `?framework=X` pula o FrameworkPicker
- [ ] Metadata SEO correta (title, description, og:image)
- [ ] Nenhuma chamada desnecessária ao banco (frameworks são estáticos)

## Plano de Implementação

### Pré-requisitos
- Issue 015 concluída (página `/templates` visual pronta)
- Issue 030 concluída (wizard `/sermons/new` funciona)

### Passos

**1. Garantir que `src/lib/frameworks/data.ts` está completo**
- Verificar que todos os 6 frameworks têm: id, name, tagline, description, outline, color, whenToUse
- Adicionar campo `exampleSermon?: { title, bibleRef }` para cada framework

**2. Conectar CTA "Usar este framework"**
Editar `src/components/templates/FrameworkCard.tsx` (ou `FrameworkDetail.tsx`):
- Link para `/sermons/new?framework={id}&content_type=sermão` se autenticado
- Link para `/auth/register?redirect=...` se não autenticado (usar `useSession()` do Supabase)

**3. Atualizar wizard /sermons/new para ler `?framework`**
Editar `src/app/(app)/sermons/new/page.tsx`:
- Se `searchParams.framework` presente → pular FrameworkPicker
- Exibir banner: "Framework selecionado: [Nome]" com botão "Trocar"

**4. Adicionar metadata SEO**
Editar `src/app/(public)/templates/page.tsx`:
- `export const metadata: Metadata = { title: 'Frameworks Homiléticos | VOX', description: '...' }`
- og:image gerado dinamicamente via `generateMetadata()` (pode ser estático no MVP)

**5. Adicionar link na sidebar autenticada**
Editar `src/components/shared/AppSidebar.tsx`:
- Link "Frameworks" → `/templates`

### Como Verificar
- Acessar `/templates` sem login: página carrega, "Usar" redireciona para register
- Fazer login → voltar para `/templates` → "Usar Expositivo" → `/sermons/new?framework=expositivo`
- No wizard: FrameworkPicker mostra "Expositivo" pré-selecionado, pode trocar
- Inspetor: nenhuma requisição ao banco no carregamento de `/templates`
