# Arquitetura

Camadas com dependência em um só sentido (de cima para baixo). O lint (`eslint.config.js`) barra importações na direção errada.

```
src/
  routes/           páginas e rotas de API (casca fina: só meta + componente)
  features/         telas por funcionalidade (landing, booking, admin, site-shell)
  components/ui/    componentes base (shadcn)
  shared/           formatação e hooks usados por várias telas
  actions/          server functions (TanStack Start): validam a entrada e chamam os casos de uso
  application/      casos de uso (agendar, cancelar, remarcar, horários livres) + portas (interfaces)
  domain/           regras puras: horários, política de alteração, .ics, schemas
  infrastructure/   adaptadores: Supabase, limitador de tentativas
  integrations/     clientes Supabase gerados/configurados
  config/           client.ts (dados do cliente), theme.ts (tema), site.ts (SEO)
```

## Regras de dependência

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `domain` | só TypeScript e `zod` | React, Supabase, TanStack, qualquer camada acima |
| `application` | `domain` | infraestrutura, telas, Supabase, React |
| `infrastructure` | `domain`, `application`, `integrations` | telas, `actions` |
| `actions` | tudo abaixo | — |
| `features` / `shared` / `components` | `domain`, `actions`, `config` | `application`, `infrastructure`, chave de serviço |

## Fluxo de um agendamento

`BookingPage` → `actions/public.functions.ts` (valida com zod) → `application/booking.ts` (caso de uso) → porta `BookingGateway` → `infrastructure/supabase-booking-gateway.ts` (função atômica `create_appointment_locked`).

O caso de uso decide; o adaptador só persiste. Por isso as regras são testadas sem banco, com `application/testing/in-memory-gateway.ts`.

## Testes (TDD)

- **domain**: funções puras, testes diretos (`availability`, `change-policy`, `calendar`).
- **application**: casos de uso com o gateway em memória e relógio injetado (`booking.test.ts`).
- **config**: o gerador de tema (`theme.test.ts`).
- Fluxo: escrever o teste que falha, implementar, refatorar. `npm test` roda tudo; `npm run lint` e `npm run typecheck` completam a verificação.

## Armadilhas do TanStack Start

- Pastas chamadas `server/` são bloqueadas no código do navegador; por isso as server functions ficam em `actions/`.
- Server functions precisam ser importadas direto do arquivo que as define (nada de reexportar por um arquivo intermediário).
- Código que usa a chave de serviço fica em arquivos `*.server.ts` ou dentro do handler.

## Adicionar uma regra de negócio

1. Escreva o teste em `domain/` ou `application/`.
2. Implemente na camada de menor dependência possível.
3. Se precisar de dados novos, acrescente um método à porta em `application/ports.ts`, ao gateway em memória e ao adaptador do Supabase.
4. Exponha por uma server function fina em `actions/`.
