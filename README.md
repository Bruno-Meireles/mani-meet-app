# Mani Meet — agendamento online para manicures

Sistema white-label de agendamento para salões de manicure e nail designers: site público com agendamento em poucos cliques e painel administrativo completo. Uma instalação por salão.

## Recursos

**Para a cliente**
- Agendamento por serviço, dia e horário livre, sem criar conta.
- Confirmação com botão de WhatsApp e **adicionar ao calendário** (.ics).
- **Meus agendamentos**: consultar, remarcar e cancelar (com antecedência mínima configurável).
- Lembrete por e-mail na véspera.
- Layout responsivo (mobile first), SEO local (sitemap, dados estruturados) e instalável como app (PWA simples).

**Para a administradora** (`/admin`)
- Agenda semanal, resumo do dia, faturamento estimado e clientes novas.
- Cadastro de clientes e agendamento manual.
- Serviços com duração, preço e ordem.
- **Horários de funcionamento por dia, intervalo de almoço e folgas/datas bloqueadas.**

**Técnico**
- Reserva atômica no banco (sem horários duplicados) que respeita expediente e folgas.
- Acesso anônimo ao banco bloqueado; leituras públicas só pelo servidor.
- Limite de tentativas nos endpoints públicos, validação com Zod, headers de segurança.
- Testes (Vitest), lint, typecheck e CI no GitHub Actions.

## Stack

TanStack Start (React 19, SSR) · Supabase (Postgres + Auth + RLS) · Tailwind CSS 4 + shadcn/ui · Vercel.

## Começando

```sh
cp .env.example .env     # Windows: Copy-Item .env.example .env
npm ci
npm run dev
```

Scripts: `npm run dev`, `build`, `lint`, `typecheck`, `test`, `format`.

## Documentação

- [docs/INSTALACAO.md](docs/INSTALACAO.md) — instalar para um novo cliente (marca, Supabase, variáveis, deploy, checklist de aceite).
- [docs/MANUAL-ADMIN.md](docs/MANUAL-ADMIN.md) — manual da dona do salão.
- [CONTEXT.md](CONTEXT.md) — glossário e regras do domínio.

## Personalização rápida

Tudo que muda entre clientes está em [`src/config/client.ts`](src/config/client.ts): nome, contatos, endereço, textos da home e o **tema** (preset de cores + fontes). A paleta clara e escura é gerada a partir do preset.

## Estrutura

Arquitetura em camadas, com fronteiras impostas pelo lint. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

```
src/domain/          regras puras e testadas (horários, política de alteração, .ics)
src/application/     casos de uso + portas (agendar, cancelar, remarcar)
src/infrastructure/  adaptadores (Supabase, limitador de tentativas)
src/actions/         server functions finas
src/features/        telas por funcionalidade (landing, booking, admin, site-shell)
src/config/          client.ts (dados do cliente), theme.ts, site.ts (SEO)
src/routes/          páginas e rotas de API
supabase/migrations/ banco, políticas de segurança e funções
```

## Observação sobre a Lovable

O projeto nasceu na Lovable e ainda pode estar conectado a ela. Evite reescrever o histórico do git (force push, rebase de commits já publicados).
