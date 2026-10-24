# Plano de implementação

Prioridades: P0 segurança/perda de dados/fluxo crítico · P1 usabilidade grave e fluxos essenciais · P2 consistência, acessibilidade, responsividade · P3 refinamentos.

## Concluído

| Prioridade | Item |
|---|---|
| P0 | Acesso anônimo ao banco removido; leituras e escritas públicas só pelo servidor (service role); validação e limite de tentativas |
| P0 | Reserva atômica respeitando expediente e folgas; slots calculados no fuso do salão |
| P1 | Horários por dia, intervalo e folgas editáveis no painel |
| P1 | Arquitetura em camadas com fronteiras no lint; regras e casos de uso testados sem banco |
| P1 | Tela de agendamento em passos com resumo; painel com casca, abas e agenda |
| P2 | Tema por cliente (`client.ts` + `theme.ts`), paleta clara/escura gerada |
| P2 | Rótulo no campo de telefone, calendário em português para leitores de tela, alvos de toque maiores |
| P2 | Suíte Playwright (29 testes): 6 páginas × 3 larguras, menu móvel, agendamento, login, rota protegida, robots/sitemap |

## Pendente

| Prioridade | Item | Bloqueio |
|---|---|---|
| P1 | Validar o painel `/admin` no navegador | precisa de usuário administrador de teste (ou banco local) |
| P1 | E2E do agendamento completo | precisa de banco de teste isolado; hoje coberto só por testes de caso de uso |
| P2 | Teste automatizado de contraste/acessibilidade (axe) | exige nova dependência; avaliar com o usuário |
| P2 | Revisar abas Clientes, Serviços e Horários com o mesmo padrão visual da agenda | depende da validação no navegador com login |
| P3 | Fotos reais do salão; remover serviços de teste do banco | dados do cliente |
| P3 | Recuperação de senha na tela de login | decisão de produto (não existe hoje) |

## Regras desta rodada

Sem commit, push, merge ou deploy sem pedido explícito do usuário (conforme `prompt.md`); nenhuma alteração de schema, políticas ou dados do Supabase.
