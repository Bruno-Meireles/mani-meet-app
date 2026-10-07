-- Lembretes: marca quando o lembrete de véspera foi enviado.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Correção: agendamentos cancelados/concluídos não podem bloquear o horário.
-- A versão anterior de create_appointment_locked considerava qualquer status,
-- então um horário cancelado continuava "ocupado" ao tentar reagendar.
CREATE OR REPLACE FUNCTION public.create_appointment_locked(
  p_client_name text,
  p_client_phone text,
  p_client_email text,
  p_service_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_notes text
)
RETURNS uuid AS $$
DECLARE
  v_duration int;
  v_start timestamptz;
  v_end timestamptz;
  v_conflict uuid;
  v_id uuid;
BEGIN
  SELECT duration_minutes INTO v_duration FROM public.services WHERE id = p_service_id FOR UPDATE;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado';
  END IF;

  v_start := (p_appointment_date::text || ' ' || p_appointment_time::text)::timestamptz;
  v_end := v_start + (v_duration || ' minutes')::interval;

  IF v_end <= v_start THEN
    RAISE EXCEPTION 'Invalid appointment range';
  END IF;

  SELECT a.id INTO v_conflict
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = p_appointment_date
    AND a.status IN ('scheduled', 'confirmed')
    AND tstzrange((a.appointment_date::text || ' ' || a.appointment_time::text)::timestamptz,
                  (a.appointment_date::text || ' ' || (a.appointment_time + (s.duration_minutes || ' minutes')::interval)::time::text)::timestamptz)
        && tstzrange(v_start, v_end)
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;

  INSERT INTO public.appointments (
    client_name, client_phone, client_email, service_id,
    appointment_date, appointment_time, notes
  ) VALUES (
    p_client_name, p_client_phone, p_client_email, p_service_id,
    p_appointment_date, p_appointment_time, p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_appointment_locked(text,text,text,uuid,date,time,text) TO service_role;
