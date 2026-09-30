-- Only seed if this auth user exists (Lovable Cloud). Dedicated projects
-- should run supabase/seed_admin.sql after creating the first admin user.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE id = '84c4d028-ef95-48bc-855c-a2b6da9b040b'
ON CONFLICT (user_id, role) DO NOTHING;