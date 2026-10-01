-- Run in the dedicated project's SQL editor after creating the first Auth user.
-- Replace the email with the admin account you created in Authentication > Users.

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
