-- Migration: add atomic appointment creation function to prevent overlapping bookings
-- File generated: create RPC function that locks the service row and checks for overlapping appointments

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
  v_start timestamp;
  v_end timestamp;
  v_conflict uuid;
  v_id uuid;
BEGIN
  -- Lock the service row to serialize concurrent booking attempts for the same service
  SELECT duration_minutes INTO v_duration FROM public.services WHERE id = p_service_id FOR UPDATE;
  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado';
  END IF;

  v_start := (p_appointment_date::timestamp + p_appointment_time::time);
  v_end := v_start + (v_duration || ' minutes')::interval;

  -- Check for overlapping appointments on the same date using tstzrange overlap
  SELECT a.id INTO v_conflict
  FROM public.appointments a
  JOIN public.services s ON s.id = a.service_id
  WHERE a.appointment_date = p_appointment_date
    AND tstzrange((a.appointment_date::timestamp + a.appointment_time::time)::timestamp, (a.appointment_date::timestamp + (s.duration_minutes || ' minutes')::interval)::timestamp) &&
        tstzrange(v_start::timestamp, v_end::timestamp)
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'Horário não disponível';
  END IF;

  INSERT INTO public.appointments (
    client_name,
    client_phone,
    client_email,
    service_id,
    appointment_date,
    appointment_time,
    notes
  ) VALUES (
    p_client_name,
    p_client_phone,
    p_client_email,
    p_service_id,
    p_appointment_date,
    p_appointment_time,
    p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- Grant execute to service_role so server-side calls can use it
GRANT EXECUTE ON FUNCTION public.create_appointment_locked(text,text,text,uuid,date,time,text) TO service_role;
