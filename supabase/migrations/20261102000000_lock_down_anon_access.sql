-- Segurança: o papel `anon` (chave pública) não pode mais ler nem inserir agendamentos/clientes.
-- Antes, qualquer pessoa com a chave pública conseguia listar nome e telefone de todas as clientes
-- e inserir agendamentos direto, ignorando expediente, folgas e o lock de concorrência.
-- O app agora lê e grava exclusivamente pelo servidor (service role).

DROP POLICY IF EXISTS "Anyone can view booked appointment times" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can register as client" ON public.clients;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.appointments FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.clients FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_appointment_locked(text,text,text,uuid,date,time,text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_appointment_locked(text,text,text,uuid,date,time,text) TO service_role;
