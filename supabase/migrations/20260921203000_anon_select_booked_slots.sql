-- Public booking needs to see occupied times without exposing the admin-only row set.
-- Column-level secrets are still in the row; the app only selects time + duration.
CREATE POLICY "Anyone can view booked appointment times"
ON public.appointments
FOR SELECT
TO anon, authenticated
USING (status IN ('scheduled', 'confirmed'));
