-- Copy and paste this into Supabase SQL Editor
-- After you've created the user in Authentication → Users

INSERT INTO public.usuarios (
  id,
  nombre,
  email,
  telefono,
  rol,
  activo
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'manolo@droplyexpress.com' LIMIT 1),
  'Admin Master',
  'manolo@droplyexpress.com',
  '+34 612 345 678',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  nombre = 'Admin Master',
  rol = 'admin',
  activo = true;
