# Issue 046, Configurações de Perfil: Behavior

**Status:** [ ] PENDENTE
**Tipo:** behavior
**Página:** /settings
**Depende de:** 014, 021, 020
**Prioridade:** P1

---

## O Que Fazer

Conectar a página de configurações (proto 014) ao Supabase:
salvar dados de perfil, preferências de usuário, upload de avatar,
e toggle de IA. A senha é gerenciada pelo Supabase Auth.

## Componentes Envolvidos

- `src/app/(app)/settings/page.tsx`, Server Component carrega perfil
- `src/lib/supabase/actions/profile.ts`, Server Actions de perfil
- `src/components/settings/ProfileForm.tsx`, formulário conectado
- `src/components/settings/AvatarUpload.tsx`, upload real para Supabase Storage
- `src/components/settings/PreferencesForm.tsx`, preferências conectadas

## Comportamentos

### Carregar perfil
- Server Component: `SELECT * FROM profiles WHERE id = auth.uid()`
- Passado como props para os formulários client-side

### Atualizar perfil
- `UPDATE profiles SET name = ?, denomination = ?, ... WHERE id = auth.uid()`
- Validação Zod: `name` (1-100 chars obrigatório), `denomination` (max 100, opcional)
- Auto-save por campo (onBlur) OU botão "Salvar alterações"
- Toast de confirmação: "Perfil atualizado"

### Upload de avatar
- Bucket: `avatars` (criar migration separada ou junto de profiles)
- Estrutura: `avatars/{user_id}/avatar.{ext}`
- Aceita: JPG, PNG, WebP, máx 2MB
- Após upload: `UPDATE profiles SET avatar_url = publicUrl`
- Exibe preview imediato após seleção (antes de salvar)

### Preferências
- `bible_version`: SELECT → `UPDATE profiles SET bible_version = ?`
  - Opções: 'ARC', 'NVI', 'NVT', 'NTLH'
- `ai_enabled`: toggle → `UPDATE profiles SET ai_enabled = ?`
  - Ao desativar: confirmar ("Desativar remove o botão Assistente do editor")

### Alterar senha
- Server Action que chama `supabase.auth.updateUser({ password: newPassword })`
- Validação: senha atual (verificar via re-autenticação), nova senha >= 8 chars, confirmação igual
- Não armazenar senhas, apenas repassar ao Supabase Auth

### Deletar conta (zona de perigo)
- Requer confirmação em duas etapas:
  1. Dialog: "Tem certeza? Isso é irreversível."
  2. Input: digitar "DELETAR" para confirmar
- Ação: `supabase.auth.admin.deleteUser(userId)` (via Service Role em Route Handler)
- Soft delete de todos os conteúdos, depois anonimizar o usuário
- Redireciona para página de confirmação: "Conta encerrada. Obrigado."

### Schema adicional necessário
```sql
-- Adicionar campo cargo_pastoral ao profiles (migration 010)
alter table public.profiles
  add column role_title text;  -- ex: "Pastor Titular", "Evangelista"

-- Bucket de avatares (migration ou dashboard)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Usuário gerencia próprio avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

## Critério de Aceite

- [ ] Perfil carregado com dados reais ao abrir /settings
- [ ] Salvar nome/denominação persiste no banco
- [ ] Upload de avatar funciona (foto aparece no header após atualizar)
- [ ] `bible_version` salvo e usado como default no BibleSearch
- [ ] Toggle `ai_enabled` persiste e realmente esconde/mostra o assistente
- [ ] Alterar senha funciona com validação de senha atual
- [ ] Erro claro se senha atual incorreta
- [ ] Deletar conta: dupla confirmação + redirecionamento

## Plano de Implementação

### Pré-requisitos
- Issue 014 concluída (formulários visuais prontos)
- Issue 021 concluída (auth configurada, `profiles` table existe)
- Migration para `role_title` e bucket `avatars` (criar aqui)

### Passos

**1. Criar Server Actions de perfil**
Criar `src/lib/supabase/actions/profile.ts` (`"use server"`):
- `updateProfile(data)` → UPDATE profiles, validação Zod
- `updatePassword(current, newPassword)` → supabase.auth.updateUser
- `updateAIEnabled(enabled)` → UPDATE profiles SET ai_enabled
- `updateBibleVersion(version)` → UPDATE profiles SET bible_version

**2. Criar Route Handler para deletar conta**
Criar `src/app/api/account/delete/route.ts` (Service Role Key):
- Verificar autenticação + confirmação do body
- Soft delete conteúdos → deletar usuário do Auth

**3. Conectar ProfileForm**
Editar `src/components/settings/ProfileForm.tsx`:
- Receber `profile` como prop (do Server Component)
- `useFormState` com `updateProfile` action
- Indicador "Salvo" após submit

**4. Implementar AvatarUpload**
Editar `src/components/settings/AvatarUpload.tsx`:
- `<input type="file" accept="image/*">` + preview com `URL.createObjectURL`
- Upload para Storage via `supabase.storage.from('avatars').upload(...)`
- Após upload: `updateProfile({ avatar_url: publicUrl })`

**5. Conectar PreferencesForm**
- Toggle `ai_enabled`: `updateAIEnabled()` no onChange
- Select `bible_version`: `updateBibleVersion()` no onChange

### Como Verificar
- Editar nome → reload da página → nome novo exibido
- Upload avatar → aparece no AppHeader imediatamente
- Toggle IA → botão Assistente aparece/desaparece no editor
- Alterar senha → login com nova senha funciona
