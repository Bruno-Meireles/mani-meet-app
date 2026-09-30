# Manicure Agendado

Site com agendamento para salão de manicure. O código é independente da Lovable: backend no **seu** projeto Supabase e o app em host SSR próprio.

## Sair da Lovable (checklist)

Faça nesta ordem. **Não** clique em Remove Lovable Cloud antes do site novo estar estável.

### 1. Exportar a Cloud e criar o Supabase dedicado

1. Na Lovable: **Cloud → Overview → Advanced settings → Export project data**. Guarde o backup (tabelas + Auth).
2. Crie um projeto em [supabase.com](https://supabase.com) (Free serve). Anote o **project ref**, a URL `https://<ref>.supabase.co` e as chaves em **Project Settings → API**.
3. Este repositório ainda aponta no `.env` local para `*.lovable.cloud` até você copiar [`.env.example`](.env.example).

### 2. Schema, dados e admin

No PowerShell, autenticado na CLI (`npx supabase login`):

```powershell
.\scripts\apply-dedicated-supabase.ps1 -ProjectRef SEU_REF
```

Isso faz `supabase link` + `db push` das migrations em [`supabase/migrations/`](supabase/migrations/).

Depois:

1. Restaure o export da Cloud (SQL / CSV) se quiser os dados atuais.
2. Se o Auth não veio no backup, crie o usuário admin em **Authentication → Users**.
3. Edite [`supabase/seed_admin.sql`](supabase/seed_admin.sql) com o email desse usuário e rode no SQL Editor.
4. **Authentication → Providers**: email/senha ligado. Google: Client ID/Secret do Google Cloud Console. Redirect: `https://<ref>.supabase.co/auth/v1/callback`.
5. **Authentication → URL configuration**: Site URL e Redirect URLs com `http://localhost:5173` (ou a porta do Vite), `/login`, e o domínio de produção.

### 3. Variáveis de ambiente

Copie `.env.example` para `.env` (não é commitado) com as chaves do projeto **novo**, não as da Cloud.

O login Google usa `supabase.auth.signInWithOAuth` (não mais `@lovable.dev/cloud-auth-js`).

### 4. Hospedar (SSR)

O build é TanStack Start + Nitro (alvo Cloudflare). Site estático puro não funciona.

**Cloudflare Workers** (recomendado):

```sh
npx wrangler login
npm run deploy
```

O Nitro gera `.output/server/wrangler.json` no build; o script `deploy` usa esse arquivo.

Defina `VITE_SUPABASE_*` **no build** (ficam no bundle) e `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` como secrets do Worker (`wrangler secret put ...`) para o SSR.

**Node** (VPS, Docker, ou adaptador Vercel/Node):

```sh
npm run build
npm start
```

Confira: agendar no público, login email, Google, CRUD no admin.

### 5. Cortar a Lovable (por último)

Quando o domínio novo estiver ok:

1. Lovable: **Remove Lovable Cloud** (permanente; não migra dados sozinho).
2. Pare de usar `https://mani-meet-app.lovable.app`.
3. Desconecte o projeto no editor se não quiser mais sync com o GitHub. Não faça force-push do histórico enquanto o sync existir.

## Desenvolvimento local

Node.js + npm:

```sh
cp .env.example .env   # no Windows: Copy-Item .env.example .env
npm i
npm run dev
```
