# Contexto do domínio — Mani Meet

Sistema de agendamento online para salões de manicure. Uma instalação por salão (white-label por `src/config/site.ts`).

## Glossário

- **Salão**: o negócio que usa o sistema (marca, contatos, horário). Configurado em `src/config/site.ts`.
- **Serviço**: item do catálogo (nome, duração em minutos, preço, ativo/inativo, ordem). Tabela `services`.
- **Agendamento**: reserva de um Serviço em data + hora por um Cliente. Tabela `appointments`. Status: `scheduled`, `confirmed`, `completed`, `cancelled`.
- **Cliente**: pessoa que agenda, identificada pelo telefone. Tabela `clients`. Não precisa de conta para agendar.
- **Slot**: horário livre calculado a partir do horário de funcionamento, da duração do Serviço e dos Agendamentos existentes (`generateTimeSlots`).
- **Admin**: usuária com papel `admin` em `user_roles`; acessa `/admin`.
- **Antecedência mínima**: horas antes do atendimento em que o Cliente ainda pode cancelar/remarcar (`CLIENT_CHANGE_MIN_HOURS`).
- **Lembrete**: e-mail enviado na véspera pela rota `/api/public/send-reminders` (cron diário).

## Regras importantes

- A criação de agendamento é atômica (`create_appointment_locked`) para impedir reservas sobrepostas.
- Datas e horas são interpretadas no fuso do Salão.
