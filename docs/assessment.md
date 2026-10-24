# Diagnóstico do projeto

Atualizado em 24/10/2026. Complementa `PLANO-PROFISSIONALIZACAO.md` (plano de entrega) e `docs/ARQUITETURA.md`.

## Arquitetura e stack

TanStack Start (React 19, SSR) · Supabase (Postgres + Auth + RLS) · Tailwind CSS 4 + shadcn/ui · Vercel (preset Nitro `vercel`). Camadas `domain` → `application` → `infrastructure` → `actions` → `features/routes`, com fronteiras impostas pelo ESLint (detalhes em `docs/ARQUITETURA.md`). Não há design system em pacote separado: os tokens ficam em `src/config/theme.ts` (paleta gerada) e `src/styles.css`, e os componentes base em `src/components/ui` (shadcn). Não se justifica um monorepo para o tamanho atual.

## Inventário de rotas

| Rota | Tipo | Observação |
|---|---|---|
| `/` | pública | landing: hero, serviços, como funciona, FAQ, endereço e horário, CTA |
| `/agendar` | pública | agendamento em 3 passos com resumo lateral |
| `/meus-agendamentos` | pública | consulta por telefone; cancelar/remarcar com 12 h de antecedência |
| `/sobre`, `/privacidade` | públicas | conteúdo vem de `src/config/client.ts` |
| `/login` | pública (noindex) | e-mail e senha |
| `/admin` | autenticada (noindex) | Agenda, Clientes, Serviços, Horários |
| `/api/public/send-reminders` | API (cron) | exige `CRON_SECRET` |
| `/robots.txt`, `/sitemap.xml` | geradas | |

## O que precisa ser preservado

Reserva atômica (`create_appointment_locked`), horários por dia/intervalo/folgas no fuso do salão, acesso anônimo bloqueado no banco (leituras públicas só pelo servidor), limite de tentativas, validação com zod, regra das 12 horas, e-mail de lembrete, geração de `.ics`, SEO (sitemap, JSON-LD), configuração por cliente em `client.ts`.

## Verificações executadas (24/10/2026)

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | sem erros |
| `npm run lint` | sem erros |
| `npm test` (Vitest) | 51 testes passando (domínio, casos de uso, tema, limitador) |
| `npm run build` (preset vercel) | sucesso |
| `npm run test:e2e` (Playwright, Chrome do sistema) | 29 testes passando em duas execuções seguidas |
| Inspeção real no navegador (site publicado, 6 páginas × 390/768/1440 px) | 18/18 respondem 200, sem rolagem horizontal, sem erros de console |

## Defeitos comprovados

| # | Defeito | Prioridade | Situação |
|---|---|---|---|
| 1 | Campo de telefone de "Meus agendamentos" sem rótulo associado | P1 (acessibilidade) | corrigido, coberto por e2e |
| 2 | Calendário anunciava em inglês para leitores de tela ("Go to the Previous Month", "Today, …") | P1 | corrigido, coberto por e2e |
| 3 | Dias e setas do calendário com 32×32 px (pequeno para toque) | P2 | agora 36 px no celular e 40 px a partir de 640 px, coberto por e2e |

## Pendências de dados e configuração (não são código)

- O banco de produção tem serviços de teste ("teste", "dd", "alogamentos em gel teste") que aparecem na tela de agendamento.
- A conta `demo@teste.com`, se for administradora no Supabase, deve ser desativada.
- `SUPABASE_PROJECT_ID` na Vercel ainda tem o valor antigo (a aplicação quase não o usa).
- Imagens de serviço e destaque são ilustrações SVG de exemplo.
- Depoimentos e números de destaque ficam ocultos até haver dados reais em `client.ts`.

## Limitações de validação

- **Painel `/admin` não foi validado em navegador**: exige login real no Supabase, e não há credenciais de teste nem banco local (Docker é desaconselhável aqui). A proteção de rota (redirecionar para `/login`) está coberta; a interface logada só passou por tipos, lint e build.
- **Concluir um agendamento de ponta a ponta no navegador não foi automatizado**: depende do banco. A regra está coberta por testes de caso de uso com banco em memória. A função atômica do banco (`create_appointment_locked`) não foi exercitada de ponta a ponta nesta rodada; o checklist de aceite em `docs/INSTALACAO.md` prevê esse teste manual.
- A suíte e2e roda contra o servidor de desenvolvimento com variáveis falsas do Supabase; por isso cobre navegação, layout, rótulos, acessibilidade básica e erros de login, não dados reais.
- Não há contraste automatizado (axe) no projeto; a checagem de acessibilidade foi feita por inspeção do DOM (rótulos, nomes, alt, alvos de toque).

## Plano priorizado

Veja `docs/implementation-plan.md`.
