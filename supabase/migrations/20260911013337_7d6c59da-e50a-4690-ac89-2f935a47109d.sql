INSERT INTO public.user_roles (user_id, role)
VALUES ('84c4d028-ef95-48bc-855c-a2b6da9b040b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;