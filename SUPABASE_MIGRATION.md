# Migração para Supabase dedicado — Checklist e Permissões

Resumo
- Objetivo: migrar este projeto (mani-meet-app) da Lovable Cloud para um Supabase dedicado e usar somente autenticação por email/senha.
- Este arquivo descreve os passos que já executamos, comandos a rodar, arquivos chave e o escopo de ações que você me autorizou a executar automaticamente.

Pré-requisitos
- Credenciais do Supabase dedicado inseridas em `.env` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
- Supabase CLI instalado e autenticado localmente se formos usar `supabase`.
- Node/npm (ou bun) instalados para instalar dependências e rodar a aplicação localmente.

Passos prioritários (resumido)
1. Criar branch de trabalho
   - git checkout -b feature/dedicated-supabase-migration
2. Inventário
   - Localizar referências a Lovable e arquivar integrações (já feito: `archive-lovable/`).
3. Aplicar migrations
   - Vincular projeto com `npx supabase link --project-ref <PROJECT_REF>` ou editar `supabase/config.toml`.
   - Aplicar migrations: `supabase db push` ou `psql -h <host> -U <user> -d <db> -f supabase/migrations/*.sql`.
   - Rodar seeds: `psql ... -f supabase/seed_admin.sql` (conforme necessário).
4. Autenticação
   - Desativar OAuth Google no painel Supabase (opcional) e ajustar o código para usar email/senha.
   - Atualizar `src/routes/login.tsx` para usar `supabase.auth.signUp` / `supabase.auth.signInWithPassword` (ou API v2 equivalente).
   - Estratégia de usuários existentes: preferir enviar reset/invite em massa em vez de migrar hashes.
5. Ajustes de código e deps
   - Arquivar/remover `@lovable.dev/*` gradualmente após validação.
   - Atualizar `vite.config.ts`, `package.json`, e os clientes em `src/integrations/supabase/*` para apontar as variáveis de ambiente novas.
6. Testes e staging
   - Rodar `npm ci` e `npm run dev` e checklist manual (signup, login, criar/visualizar/cancelar booking, notificações WhatsApp).
   - Deploy em staging e smoke tests.
7. Cutover final
   - Quando tudo estiver validado, remover artefatos Lovable e atualizar README/AGENTS.md. (Não será feito até sua autorização final.)

Comandos úteis
- Criar branch: git checkout -b feature/dedicated-supabase-migration
- Aplicar migrations (supabase CLI):
  - npx supabase link --project-ref <PROJECT_REF>
  - npx supabase db push
- Rodar app: npm ci && npm run dev
- Rodar testes: npm test (ou o script do package.json)

Arquivos-chave a editar
- .env / .env.example
- supabase/config.toml
- supabase/migrations/*
- src/routes/login.tsx (login/signup)
- src/integrations/supabase/client.ts / client.server.ts
- package.json (remover deps @lovable.dev quando for seguro)
- README.md / AGENTS.md (documentação de corte)

Riscos e recomendações
- Não migrar hashes de senha entre provedores sem entender o algoritmo. Recomenda-se reset/invite.
- Não remover pacotes @lovable.dev até validar que substitutos existem, pois podem providenciar presets/build plugins.
- Nunca comitar chaves secretas (service_role). Use variáveis de ambiente locais e config do CI.

Escopo de ações AUTORIZADAS por você (executei parte já)
- Criar/alternar branch localmente (feito).
- Arquivar integração Lovable movendo os arquivos para `archive-lovable/` e commitar (feito).
- Ler arquivos do repositório e aplicar edições não-destrutivas (modificar código, atualizar configs, criar/editar arquivos).
- Rodar comandos locais não-destrutivos: `npm ci`, `npm run dev`, `npm test`, `npx supabase db push`, `psql` (quando `supabase` is configured and credentials available).
- Criar commits locais com mensagens claras (não pushar para remoto sem sua autorização explícita).

Ações que NÃO estão autorizadas (pedirei confirmação separada)
- Push para remoto (`git push`) ou alteração de branches remotas.
- Force-push, rebase/amend públicos ou qualquer operação que reescreva história remota.
- Remoção permanente de dados de produção, exclusão de tabelas ou operações destrutivas sem confirmação.
- Publicar chaves ou segredos no repositório.

O que eu vou fazer a seguir (se você confirmar)
- Continuar implementando a autenticação por email/senha em `src/routes/login.tsx` e `src/integrations/supabase/*`.
- Rodar testes locais e reportar erros/falhas.
- Se tudo OK, aplicar migrations/seeds no projeto dedicado (usando as credenciais em `.env`) e executar smoke tests locais.

Confirmação necessária
- Confirmar que você aprova o Escopo de ações AUTORIZADAS acima (responda: "Autorizo: sim" para eu continuar). Se quiser restringir algo (por exemplo, não rodar `npm ci` automaticamente), diga qual item quer revogar.

Se preferir que eu apenas gere este README e espere para executar ações, responda "Apenas README".

