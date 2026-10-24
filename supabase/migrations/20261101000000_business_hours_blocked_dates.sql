-- Horário de funcionamento por dia da semana e folgas/datas bloqueadas.
-- Também corrige create_appointment_locked: agendamentos cancelados/concluídos
-- não devem mais bloquear o horário, e a reserva respeita expediente e folgas.

CREATE TABLE IF NOT EXISTS public.business_hours (
  weekday smallint PRIMARY KEY CHECK (weekday BETWEEN 0 AND 6), -- 0 = domingo
  is_open boolean NOT NULL DEFAULT true,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '19:00',
  break_start time,
  break_end time,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (close_time > open_time),
  CHECK ((break_start IS NULL AND break_end IS NULL)
      OR (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start))
);

CREATE TABLE IF NOT EXISTS public.blocked_dates (
  blocked_date date PRIMARY KEY,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business hours"
  ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage business hours"
  ON public.business_hours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage blocked dates"
  ON public.blocked_dates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.business_hours (weekday, is_open, open_time, close_time) VALUES
  (0, false, '09:00', '19:00'),
  (1, true,  '09:00', '19:00'),
  (2, true,  '09:00', '19:00'),
  (3, true,  '09:00', '19:00'),
  (4, true,  '09:00', '19:00'),
  (5, true,  '09:00', '19:00'),
  (6, true,  '09:00', '14:00')
ON CONFLICT (weekday) DO NOTHING;

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
  v_hours public.business_hours%ROWTYPE;
  v_end_time time;
BEGIN
  -- Serializa tentativas concorrentes para o mesmo serviço.
  SELECT duration_minutes INTO v_duration FROM public.services WHERE id = p_service_id FOR UPDATE;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.blocked_dates WHERE blocked_date = p_appointment_date) THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;

  SELECT * INTO v_hours FROM public.business_hours
   WHERE weekday = EXTRACT(DOW FROM p_appointment_date)::smallint;
  IF FOUND THEN
    v_end_time := p_appointment_time + (v_duration || ' minutes')::interval;
    IF NOT v_hours.is_open
       OR p_appointment_time < v_hours.open_time
       OR v_end_time > v_hours.close_time
       OR v_end_time < p_appointment_time
       OR (v_hours.break_start IS NOT NULL
           AND p_appointment_time < v_hours.break_end
           AND v_end_time > v_hours.break_start) THEN
      RAISE EXCEPTION 'Horário não disponível';
    END IF;
  END IF;

  v_start := (p_appointment_date::text || ' ' || p_appointment_time::text)::timestamptz;
  v_end := v_start + (v_duration || ' minutes')::interval;

  SELECT a.id INTO v_conflict
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = p_appointment_date
    AND a.status IN ('scheduled', 'confirmed')
    AND tstzrange(
          (a.appointment_date::text || ' ' || a.appointment_time::text)::timestamptz,
          (a.appointment_date::text || ' ' || a.appointment_time::text)::timestamptz
            + (s.duration_minutes || ' minutes')::interval
        ) && tstzrange(v_start, v_end)
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
