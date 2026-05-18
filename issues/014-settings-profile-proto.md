# Issue 014, Configurações de Perfil UI Proto

**Status:** [ ] PENDENTE
**Tipo:** proto
**Página:** /settings
**Depende de:** 023, 005
**Prioridade:** P1

---

## O Que Fazer

Criar o protótipo visual completo da página de configurações: perfil do usuário,
preferências do sistema, e toggles de funcionalidades opcionais.

## Componentes Envolvidos

- `src/app/(app)/settings/page.tsx`, página de settings com tabs
- `src/components/settings/ProfileForm.tsx`, formulário de perfil
- `src/components/settings/PreferencesForm.tsx`, preferências de sistema
- `src/components/settings/AvatarUpload.tsx`, upload de foto de perfil

## Layout Geral

- Tabs laterais (desktop) / tabs horizontais (mobile):
  - "Perfil", dados pessoais e foto
  - "Preferências", bíblia, idioma, notificações
  - "IA", toggle de módulo de IA
  - "Blocos" → link para `/settings/blocks` (issue 012)
  - "Conta", alterar senha, deletar conta

---

## Tab: Perfil

### Foto de perfil
- Avatar circular 96px com foto atual (placeholder: iniciais)
- Botão "Alterar foto" abaixo (visual, sem upload real no proto)
- Hint: "JPG ou PNG, máx. 2MB"

### Formulário de dados
- Nome completo: Input Geist 14px
- Email: Input read-only com badge "Verificado" Forest
- Denominação/Organização: Input (opcional)
- Cargo pastoral: Input (ex: "Pastor Titular", "Evangelista") (opcional)
- Botão "Salvar alterações" (Forest Deep) + indicador "Salvo" Geist Mono Muted

---

## Tab: Preferências

### Versão bíblica padrão
- Label: "Versão bíblica padrão"
- Select com opções: ARC, NVI, NVT, NTLH
- Hint: "Usada como padrão ao buscar versículos no editor"

### Idioma
- Select: "Português (Brasil)" (única opção no MVP)
- Hint: "Apenas PT-BR disponível no momento"

### Auto-save
- Toggle: "Salvar automaticamente enquanto edito"
- On por padrão
- Hint: "O sistema salva suas mudanças a cada 800ms de inatividade"

---

## Tab: IA

### Toggle de ativação
- Toggle grande com label: "Ativar Assistente de IA"
- Off por padrão
- Quando on: badge "Ativo" Forest
- Descrição: "O assistente usa modelos de linguagem para sugerir estruturas de sermão. Seu conteúdo não é armazenado permanentemente."
- Link "Saiba mais sobre privacidade" → (placeholder)

### Aviso de custo/uso
- Quando ativado: "Máximo de 10 sugestões por hora por conta."
- Contador mock: "7 sugestões usadas hoje"

---

## Tab: Conta

### Alterar senha
- Campos: senha atual, nova senha, confirmar nova senha
- Botão "Alterar senha"

### Zona de perigo
- Seção com borda vermelha suave
- "Excluir minha conta", botão outline vermelho
- Hint: "Esta ação é irreversível. Todos os seus sermões serão deletados."

## Critério de Aceite

- [ ] 5 tabs renderizando (Perfil, Preferências, IA, Blocos, Conta)
- [ ] Tab Perfil: formulário com todos os campos + avatar placeholder
- [ ] Tab Preferências: todos os selects e toggles renderizando
- [ ] Tab IA: toggle funcional visualmente (on/off muda aparência)
- [ ] Tab Conta: formulário de senha + zona de perigo
- [ ] Botão "Blocos" redireciona para `/settings/blocks`
- [ ] Responsivo: tabs horizontais no mobile

## Plano de Implementação

### Pré-requisitos
- Issue 023 concluída (shadcn/ui disponível)

### Passos

**1. Criar página de settings com tabs**
Criar `src/app/(app)/settings/page.tsx`:
- shadcn `Tabs` horizontal no mobile, vertical no desktop (CSS breakpoint)
- 5 TabsTrigger + 5 TabsContent

**2. Criar ProfileForm**
Criar `src/components/settings/ProfileForm.tsx`:
- `AvatarUpload` inline (placeholder com iniciais)
- shadcn `Input` para cada campo
- Estado local com valores mock (não conectado)

**3. Criar PreferencesForm**
Criar `src/components/settings/PreferencesForm.tsx`:
- shadcn `Select` para bíblia e idioma
- shadcn `Switch` para auto-save

**4. Tab IA**
- shadcn `Switch` grande + badge condicional "Ativo"
- Texto descritivo e aviso de uso (estado local)

**5. Tab Conta**
- Formulário de senha (campos controlados, sem funcionalidade)
- Zona de perigo: `<div className="border border-destructive/30 rounded-lg p-4">`

### Como Verificar
- Navegar entre todas as tabs sem erro
- Toggle de IA muda visualmente (badge aparece/desaparece)
- Clicar em "Blocos" navega para `/settings/blocks`
- Mobile: tabs ficam horizontais no topo
