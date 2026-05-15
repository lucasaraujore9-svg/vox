# /setup — Configurar Ambiente

## O que este comando faz
Configura o ambiente de desenvolvimento do VOX pela primeira vez.

## Passos

1. **Verifique o Node.js**
   ```bash
   node --version  # deve ser >= 20
   ```

2. **Instale dependências**
   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Preencha no `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (servidor apenas)
   - `OPENAI_API_KEY` — Chave OpenAI (opcional, para módulo de IA)
   - `BIBLE_API_KEY` — Chave API.Bible

4. **Configure o Supabase**
   - Crie um projeto em [supabase.com](https://supabase.com)
   - Execute as migrations em `docs/references/architecture.md`
   - Habilite Auth (Email/Password)

5. **Inicie o servidor**
   ```bash
   npm run dev
   ```
   Acesse: http://localhost:3000

## Referências
- `docs/references/architecture.md` — schema do banco e migrations
- `CLAUDE.md` — visão geral do projeto
