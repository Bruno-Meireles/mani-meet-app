# Instalação para um novo cliente (≈ 1 hora)

Modelo: **uma instalação por salão** — cada cliente tem o próprio projeto Supabase, o próprio deploy na Vercel e o próprio domínio. Nada é compartilhado entre clientes.

## 0. Pré-requisitos

- Conta no [Supabase](https://supabase.com) (plano gratuito atende) e na [Vercel](https://vercel.com).
- Node.js 22+ e o repositório clonado (`npm ci`).
- (Opcional) Conta no [Resend](https://resend.com) para e-mails de lembrete, com domínio verificado.

## 1. Personalizar a marca

1. Edite **`src/config/site.ts`**: nome, slogan, endereço, telefone, WhatsApp, Instagram, horário exibido, textos da home e do "Sobre", `url` do site e fuso.
2. Cores: ajuste as variáveis `--primary`, `--secondary`, `--background` etc. no bloco `:root` de `src/styles.css`.
3. Imagens: troque os arquivos de `public/images/` (mantenha os nomes) por fotos reais do salão, preferencialmente em WebP/SVG leves.
4. `public/manifest.webmanifest` e `public/favicon.svg`: nome curto e ícone do cliente.

## 2. Criar o Supabase do cliente

1. Crie um projeto novo e anote **Project ref**, **URL**, chave **publishable/anon** e **service role** (Project Settings → API).
2. Aplique o banco (PowerShell, já logado com `npx supabase login`):

   ```powershell
   .\scripts\apply-dedicated-supabase.ps1 -ProjectRef SEU_REF
   ```

   Isso executa todas as migrations em `supabase/migrations/` (tabelas, políticas de segurança, horários de funcionamento, função de reserva atômica).

3. **Authentication → Users**: crie o usuário da dona do salão (e-mail + senha).
4. Edite `supabase/seed_admin.sql` com esse e-mail e rode no **SQL Editor** — isso concede o papel de administradora.
5. **Authentication → URL configuration**: Site URL = domínio final; adicione também `/login` e o domínio da Vercel em Redirect URLs.
6. (Opcional) Login com Google: Authentication → Providers → Google.
7. Cadastre os serviços do salão pelo painel (aba **Serviços**) depois do primeiro login.

## 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatória | Observação |
|---|---|---|
| `VITE_SUPABASE_URL` | sim | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | sim | chave publishable/anon |
| `SUPABASE_URL` | sim | mesma URL (usada no servidor) |
| `SUPABASE_PUBLISHABLE_KEY` | sim | mesma chave |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | **secreta** — só no servidor; é com ela que o site grava e lê agendamentos |
| `CRON_SECRET` | para lembretes | texto longo e aleatório; a Vercel o envia no cron |
| `RESEND_API_KEY` | para lembretes | chave do Resend |
| `REMINDER_FROM_EMAIL` | para lembretes | ex.: `Nome do Salão <lembretes@dominio.com>` |
| `VITE_WHATSAPP_NUMBER` | não | substitui o WhatsApp de `site.ts` |

Nunca coloque a service role em variáveis `VITE_*` (elas vão para o navegador).

## 4. Deploy

1. Importe o repositório na Vercel. O `vercel.json` já define o preset de build e o cron diário dos lembretes (18h de Brasília).
2. Configure as variáveis acima e faça o deploy.
3. Em **Domains**, adicione o domínio do cliente e atualize `siteConfig.url` e as URLs do Supabase.

## 5. Checklist de aceite (faça com o cliente)

- [ ] Home, Sobre e Política de privacidade com os dados corretos.
- [ ] Login da administradora funciona em `/login` e abre `/admin`.
- [ ] Aba **Horários**: dias/horários conferidos; uma folga de teste bloqueia o dia no calendário.
- [ ] Cadastro de pelo menos um serviço ativo.
- [ ] Agendamento completo como cliente: aparece no painel, botão WhatsApp e "Adicionar ao calendário" funcionam.
- [ ] Dois agendamentos no mesmo horário: o segundo é recusado.
- [ ] Cancelar/remarcar em **Meus agendamentos**.
- [ ] Lembrete: chame `GET /api/public/send-reminders` com `Authorization: Bearer <CRON_SECRET>` e confira o retorno.
- [ ] `https://dominio/robots.txt` e `/sitemap.xml` abrem; enviar o sitemap no Google Search Console.
- [ ] Teste no celular.

## Segurança — o que já vem configurado

- O acesso anônimo ao banco é bloqueado: nomes e telefones de clientes só são lidos pelo servidor e pelo painel autenticado.
- A reserva é atômica no banco (sem horários duplicados) e respeita expediente e folgas também no servidor.
- Limite de tentativas por IP nos endpoints públicos; ative também o **Attack Challenge Mode/WAF** da Vercel se o salão sofrer abuso.
- Faça backup periódico (Supabase → Database → Backups) e troque as chaves se houver suspeita de vazamento.
