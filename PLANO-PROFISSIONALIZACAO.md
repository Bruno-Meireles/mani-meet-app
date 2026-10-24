# Plano de profissionalização — Mani Meet (sistema de agendamento para manicures)

Objetivo: transformar o projeto num produto revendável (white-label), estável, seguro e fácil de instalar para um novo cliente em poucas horas.

Skills usadas (de `.agents/skills`): `implement` + `tdd` (fluxo de implementação), `diagnosing-bugs`, `improve-codebase-architecture`/`codebase-design`, `domain-modeling` (CONTEXT.md), `code-review` (ao fim de cada fase), `pr`.

Regras: trabalho na branch `worktree-profissionalizacao`; sem reescrever histórico (projeto sincronizado com a Lovable); cada fase termina com `build` + `lint` verdes e commit.

## Diagnóstico do estado atual

- Stack: TanStack Start + Supabase + Tailwind/shadcn, SSR via Nitro (alvo Cloudflare, mas hospedado na Vercel).
- Marca "Nail Studio", textos, endereço e contatos fixos no código → impossível revender sem editar código.
- Resquícios da Lovable (`lovable-error-reporting`, `LOVABLE_CRON_SECRET`, `@lovable.dev/vite-tanstack-config`, pasta `archive-lovable`).
- Sem testes automatizados, sem CI, sem tratamento de erro/monitoramento próprio.
- Nome do pacote genérico (`tanstack_start_ts`), README focado em migração, sem docs de venda/instalação.
- `propostas/` (proposta comercial) não versionada.
- Admin sem fluxos comuns de salão (horário de funcionamento, folgas, profissionais, bloqueio de datas) — a confirmar na Fase 2.

## Fase 0 — Base e higiene (fundação)
1. Rodar `npm i`, `build`, `lint`; registrar baseline de erros.
2. Corrigir deploy Vercel: preset Nitro `vercel` (variável `NITRO_PRESET`/config), `vercel.json`, remover dependência prática de Cloudflare/wrangler (ou manter como opção documentada).
3. Renomear pacote, limpar `archive-lovable`, `.output`, `.wrangler`, `.tanstack` do versionamento (`.gitignore`).
4. Remover/neutralizar código Lovable: error reporting, `LOVABLE_CRON_SECRET` → `CRON_SECRET`.
5. Escrever `CONTEXT.md` (glossário: Serviço, Agendamento, Cliente, Slot, Admin) com `domain-modeling`.

## Fase 1 — White-label (o que torna vendável)
1. Arquivo único `src/config/site.ts` (nome, slogan, cores, logo, endereço, telefone, WhatsApp, Instagram, horário, fuso, textos da home/sobre) lido por Header, Home, Sobre, rodapé, SEO e e-mails.
2. Tema por variáveis CSS (paleta trocável por uma linha) + logo/imagens em `public/brand/`.
3. Horário de funcionamento e fuso vindos da configuração/banco (hoje fixos em `America/Sao_Paulo` e UTC-3).
4. Rodapé profissional, página de política de privacidade e termos (LGPD).

## Fase 2 — Produto: agenda completa
1. Admin: horário de funcionamento por dia, intervalos/almoço, folgas e bloqueio de datas/horários.
2. Admin: agenda diária/semanal (calendário), confirmar/cancelar/remarcar, observações, histórico do cliente.
3. Cliente: fluxo de agendamento revisado (mobile first), confirmação clara, link "adicionar ao calendário" (.ics), cancelar/remarcar com regra de antecedência.
4. Notificações: e-mail (Resend) de confirmação + lembrete; botão WhatsApp com mensagem pronta; agendador via Vercel Cron.
5. Relatórios no dashboard: faturamento, serviços mais pedidos, taxa de cancelamento.
6. (Opcional, a decidir) múltiplas profissionais; sinal/pagamento via Pix.

## Fase 3 — Qualidade e segurança
1. Testes (Vitest): geração de slots, regras de antecedência, schemas; teste de concorrência de reserva (já existe `scripts/test_concurrent_booking.js`) integrado.
2. Revisão de RLS/policies do Supabase, rate limit no agendamento público, validação zod em toda server function, headers de segurança.
3. Acessibilidade (labels, foco, contraste), estados de loading/erro/vazio, 404/500 próprios.
4. CI (GitHub Actions): lint + typecheck + test + build.
5. `code-review` e `security-review` ao final.

## Fase 4 — Performance, SEO e comunicação
1. Imagens otimizadas (SVG placeholders → fotos reais/WebP), meta tags/OG por página, `sitemap.xml`, `robots.txt`, JSON-LD `LocalBusiness`.
2. Lighthouse ≥ 90 em performance/acessibilidade/SEO.
3. PWA simples (manifest + ícones) para a cliente "instalar" o site.
4. Analytics opcional (Plausible/GA via config).

## Fase 5 — Entrega e venda
1. `docs/INSTALACAO.md`: checklist para novo cliente (Supabase, env, domínio, admin, cron) em ~1h.
2. `docs/MANUAL-ADMIN.md` (para a dona do salão) e `docs/MANUAL-CLIENTE.md`.
3. Script de seed com serviços de exemplo e script de onboarding (`scripts/novo-cliente.ps1`).
4. Atualizar README (produto, não migração) e versionar `propostas/` com preços/pacotes atualizados.
5. Demo pública com dados fictícios + checklist de QA final.

## Ordem sugerida
Fase 0 → 1 → 3 (testes básicos) → 2 → 4 → 5, com merge na `main` só após sua aprovação (nada é enviado ao GitHub/Vercel sem você pedir).

## Pontos que precisam da sua decisão
- Deploy: manter Vercel (recomendado, ajusto o preset) ou Cloudflare?
- Escopo da Fase 2: incluir múltiplas profissionais e pagamento Pix agora, ou deixar como "add-on" vendido à parte?
- Modelo de venda: uma instalação por cliente (mais simples, recomendado) ou um sistema multi-salão (SaaS, muito mais trabalho)?
