-- ========================================
-- MASTER ADMIN SETUP - Droply Express
-- ========================================
-- Email: manolo@droplyexpress.com
-- Password: M@n251428
-- Role: admin
-- ========================================

-- Step 1: Create auth user in Supabase Auth
-- Execute this in Supabase Authentication UI or via auth admin endpoint
-- Go to: Supabase Dashboard → Authentication → Users → Add User
-- Email: manolo@droplyexpress.com
-- Password: M@n251428
-- Email confirmed: YES

-- Step 2: After creating the auth user, insert into usuarios table
-- Get the user ID from auth.users table first
-- You can query it like this:
-- SELECT id FROM auth.users WHERE email = 'manolo@droplyexpress.com';

-- Then use that ID in the insert below:

INSERT INTO public.usuarios (
  id,
  nombre,
  email,
  telefono,
  rol,
  activo,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'manolo@droplyexpress.com' LIMIT 1),
  'Admin Master',
  'manolo@droplyexpress.com',
  '+34 612 345 678',
  'admin',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  nombre = 'Admin Master',
  rol = 'admin',
  activo = true,
  updated_at = now();

-- Verify the admin was created
SELECT id, nombre, email, rol, activo FROM public.usuarios 
WHERE email = 'manolo@droplyexpress.com';
