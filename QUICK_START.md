# Quick Start Guide - Droply Express Authentication

## Prerequisites

✅ Supabase project is connected (credentials in `.env.local`)
✅ Database tables are created (`usuarios`, `orders`, etc.)
✅ Application is running with `pnpm run dev`

## Step 1: Create Admin User in Supabase

Go to your Supabase Dashboard > Authentication > Users:

1. Click "Add user"
2. Enter email: `admin@droply.com`
3. Enter password: `Admin123!`
4. Click "Create user"

## Step 2: Create Admin User Profile

Go to SQL Editor in Supabase and run:

```sql
-- Create admin user profile
INSERT INTO usuarios (
  email,
  nombre,
  telefono,
  rol,
  activo,
  created_at,
  updated_at
) VALUES (
  'admin@droply.com',
  'Administrador',
  '+34 600 000 000',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
```

## Step 3: Test the System

1. Go to http://localhost:8080/login
2. Log in with:
   - Email: `admin@droply.com`
   - Password: `Admin123!`
3. You should be redirected to `/admin` dashboard

## Step 4: Create Additional Users (As Admin)

From the Admin Dashboard:

1. Click "Usuarios" tab
2. Click "Crear Nuevo Usuario"
3. Fill in the form and submit
4. Copy the generated credentials
5. Share with the new user

## Credential Generation

When you create a user in the admin panel:

✅ **System automatically:**
- Generates a secure random password
- Creates Supabase Auth user
- Creates user profile in database
- Displays credentials one time

✅ **Admin should:**
- Copy the credentials
- Share securely (email, message, etc.)
- Tell user to change password on first login (future feature)

## Testing Different Roles

### Create Test Client User:
- **Name:** Juan García
- **Email:** juan@example.com
- **Phone:** +34 612 345 678
- **Role:** Cliente
- Login to `/client` portal

### Create Test Driver User:
- **Name:** Carlos López
- **Email:** carlos@example.com
- **Phone:** +34 625 123 456
- **Role:** Repartidor
- **Vehicle:** Moto
- Login to `/driver` app

## Troubleshooting

### Error: "Invalid login credentials"
- Check email matches exactly what you created
- Check password is correct
- Verify user was created in Supabase auth system

### Error: "User not found"
- Go to Supabase > SQL Editor
- Run: `SELECT * FROM usuarios WHERE email = 'your-email@example.com';`
- If no results, the user profile isn't in the database
- Create the profile using INSERT query

### Stuck on Login Page
- Check browser console for errors (F12)
- Verify `.env.local` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Try logging out and back in

## Features Implemented

✅ **Authentication**
- Supabase Auth integration
- Email/password login
- Secure session management
- Automatic logout

✅ **User Management**
- Admin can create users
- Automatic password generation
- Role assignment
- User activation/deactivation

✅ **Role-Based Access Control**
- Protected routes
- Role-specific dashboards
- Admin dashboard
- Client portal
- Driver app

✅ **Security**
- Secure passwords (12+ chars, mixed case, numbers, special chars)
- Session tokens managed by Supabase
- Protected API endpoints (future RLS policies)
- Logout functionality

## Next Steps

1. Test all three roles (admin, client, driver)
2. Verify each role can only access their dashboard
3. Test user creation workflow
4. Test logout functionality
5. Deploy to production (when ready)

## Authentication Files

- `/login` - Public login page
- `/admin` - Admin dashboard (requires admin role)
- `/client` - Client portal (requires cliente role)
- `/driver` - Driver app (requires repartidor role)
- `client/context/AuthContext.tsx` - Auth state management
- `client/components/ProtectedRoute.tsx` - Route protection
- `client/pages/Login.tsx` - Login form

See `AUTHENTICATION_SETUP.md` for detailed information.
