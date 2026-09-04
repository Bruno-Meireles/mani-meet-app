# Plano: Site com Agendamento para Salão de Manicure

## Visão geral
Criar um site elegante e leve para um salão de manicure com uma única profissional. Clientes podem escolher serviço, dia e horário para agendar sozinhas. A profissional pode fazer login e gerenciar agendamentos (criar, editar, cancelar, visualizar calendário). Pagamento acontece no salão — o site só reserva horários.

## Design
- Estilo delicado, moderno e feminino, inspirado em salões de manicure.
- Cores base: rosa blush, nude, off-white e dourado suave.
- Tipografia: fonte serifada para títulos (elegância) e sans-serif limpa para texto.
- Layout responsivo, com navegação simples no topo.
- A foto do salão enviada pelo cliente será usada na página inicial e/ou na seção "Sobre".

## Rotas do site
- `/` — Página inicial com apresentação, serviços e botão para agendar.
- `/agendar` — Fluxo de agendamento para clientes (serviço → data → horário → dados de contato).
- `/sobre` — Sobre a manicure e o salão, com a foto do ambiente.
- `/login` — Login da profissional.
- `/admin` — Painel administrativo protegido (lista/calendário de agendamentos, criar/editar/cancelar).

## Banco de dados (Lovable Cloud)
Tabelas:
- `services` — serviços oferecidos (nome, descrição, duração em minutos, preço, ordem de exibição).
- `appointments` — agendamentos (nome cliente, telefone, email, serviço_id, data, horário, status, observação, created_at).
- `profiles` — perfil da profissional (nome, bio, foto, horário de funcionamento).
- `user_roles` — papéis de usuário (admin) para proteger o painel.

## Funcionalidades
### Para clientes
- Escolher um serviço da lista.
- Escolher data e ver horários disponíveis (filtrados pelos já agendados).
- Preencher nome, telefone e email.
- Receber confirmação na tela.

### Para a profissional (admin)
- Login com email/senha e Google.
- Calendário/visualização de agendamentos por dia/semana.
- Criar agendamento manualmente.
- Editar ou cancelar agendamentos.
- Marcar como concluído.

## Autenticação
- Email/senha + Google sign-in via Lovable Cloud.
- Apenas usuários com papel `admin` acessam `/admin`.

## Implementação
1. Definir design system e tokens no `src/styles.css`.
2. Criar rotas e componentes visuais.
3. Criar migração do banco com tabelas, grants, RLS e políticas.
4. Criar server functions para listar serviços, horários disponíveis e salvar agendamentos.
5. Criar painel administrativo com autenticação.
6. Testar fluxo de agendamento e admin.

## Próximo passo
Aguardar a foto do salão para aplicar na página inicial e ajustar a identidade visual exata.
