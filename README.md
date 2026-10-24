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

Tudo que muda entre clientes está em [`src/config/site.ts`](src/config/site.ts) (nome, contatos, endereço, textos) e nas cores de [`src/styles.css`](src/styles.css).

## Estrutura

```
src/config/site.ts        configuração white-label
src/lib/availability.ts   cálculo de horários livres (puro, testado)
src/lib/appointments.*    server functions, schemas e utilidades
src/routes/               páginas públicas, /admin e rotas de API
src/components/admin/     abas do painel
supabase/migrations/      banco, políticas de segurança e funções
```

## Observação sobre a Lovable

O projeto nasceu na Lovable e ainda pode estar conectado a ela. Evite reescrever o histórico do git (force push, rebase de commits já publicados).
