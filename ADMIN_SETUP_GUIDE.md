# 🔐 Admin Setup Guide - Manolo@droplyexpress.com

## Overview

This guide will help you complete the final setup steps:
1. ✅ **Login page updated** with new admin credentials
2. ⏳ **Database migration** - Add address fields to `usuarios` table
3. ⏳ **Admin user creation** - Create master admin account

---

## Step 1: Get Your Supabase Service Key

The system needs your Supabase **Service Role Secret** to execute the database migration and create the admin user.

### How to Get It:

1. Go to your **Supabase Dashboard**: https://supabase.io/dashboard
2. Select your **Droply Express** project
3. Click **Settings** (⚙️) in the left sidebar
4. Click **API** tab
5. Under **Project API Keys**, find the **Service Role Secret** (the second key)
6. Click the **copy icon** to copy it

> ⚠️ **Important**: Keep this key secret! Never commit it to git or share publicly.

---

## Step 2: Set the Environment Variable

Once you have the Service Role Secret, set it as an environment variable. You have two options:

### Option A: Via Settings UI (Recommended)

1. Click **Open Settings** in the top right of the Builder.io interface
2. Find the **Environment Variables** section
3. Add new variable:
   - Name: `SUPABASE_SERVICE_KEY`
   - Value: Paste your Service Role Secret
4. Click Save

### Option B: Via .env File

Add to your `.env.local` file:
```
SUPABASE_SERVICE_KEY=your_service_role_secret_here
```

Then restart the dev server.

---

## Step 3: Execute the Setup

Once the environment variable is set, you have two options:

### Option A: Automatic Setup (Recommended)

Use the provided backend endpoint to execute everything at once:

```bash
curl -X POST http://localhost:3000/api/migration/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manolo@droplyexpress.com",
    "password": "M@n251428",
    "name": "Admin Master"
  }'
```

This will:
1. ✅ Add address columns to `usuarios` table
2. ✅ Create the admin user in Supabase Auth
3. ✅ Create the admin user record in the database

### Option B: Manual SQL Execution

If you prefer to execute the SQL manually in Supabase:

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste this SQL:

```sql
-- Add address fields to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'ES';

-- Add comments for clarity
COMMENT ON COLUMN usuarios.direccion IS 'Client default pickup address (padron)';
COMMENT ON COLUMN usuarios.codigo_postal IS 'Client postal code (padron)';
COMMENT ON COLUMN usuarios.ciudad IS 'Client city (padron)';
COMMENT ON COLUMN usuarios.pais IS 'Client country (padron)';
```

5. Click **Run** (▶️ button)

Then create the admin user:

1. Go to **Authentication** → **Users** in Supabase
2. Click **Add User**
3. Enter:
   - Email: `manolo@droplyexpress.com`
   - Password: `M@n251428`
4. Click **Create User**
5. Go to **SQL Editor** and run:

```sql
INSERT INTO usuarios (id, nombre, email, rol, activo)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'manolo@droplyexpress.com'),
  'Admin Master',
  'manolo@droplyexpress.com',
  'admin',
  true
);
```

---

## Step 4: Verify Everything Works

### Test the Database Migration

Check if the columns were added successfully:

```sql
SELECT * FROM usuarios LIMIT 1;
```

You should see new columns: `direccion`, `codigo_postal`, `ciudad`, `pais`

### Test the Admin Login

1. Go to the app login page (`/login`)
2. Enter:
   - Email: `manolo@droplyexpress.com`
   - Password: `M@n251428`
3. Click **Iniciar Sesión**
4. You should be redirected to the Admin Dashboard

---

## API Endpoints Reference

If you want to use the API endpoints directly:

### Execute Migration Only

```bash
curl -X POST http://localhost:3000/api/migration/execute-migration \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "message": "Migration executed successfully"
}
```

### Create Admin User Only

```bash
curl -X POST http://localhost:3000/api/migration/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manolo@droplyexpress.com",
    "password": "M@n251428",
    "name": "Admin Master"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "userId": "uuid-here",
  "email": "manolo@droplyexpress.com"
}
```

### Execute Complete Setup

```bash
curl -X POST http://localhost:3000/api/migration/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manolo@droplyexpress.com",
    "password": "M@n251428",
    "name": "Admin Master"
  }'
```

Response:
```json
{
  "success": true,
  "migration": {
    "success": true,
    "message": "Migration executed successfully"
  },
  "admin": {
    "success": true,
    "message": "Admin user created successfully",
    "userId": "uuid-here"
  }
}
```

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_KEY is not set"

**Solution**: Make sure you've set the `SUPABASE_SERVICE_KEY` environment variable and restarted the dev server.

### Error: "exec_sql function not available"

**Solution**: Execute the SQL manually in Supabase SQL Editor (follow Option B above).

### Error: "User already registered"

**Solution**: The user exists. You can:
- Use a different email
- Or delete the existing user from Supabase Auth and try again

### "Address columns already exist"

**Solution**: This is normal! The migration uses `IF NOT EXISTS`, so it won't fail if columns are already there.

---

## What's Next?

Once the setup is complete:

1. ✅ Login with `manolo@droplyexpress.com` / `M@n251428`
2. ✅ Go to **Admin Dashboard**
3. ✅ Create your first **Cliente** user
4. ✅ Create your first **Repartidor** (driver)
5. ✅ Manage orders and deliveries

---

## Quick Reference

| Item | Value |
|------|-------|
| **Admin Email** | manolo@droplyexpress.com |
| **Admin Password** | M@n251428 |
| **Login URL** | `/login` |
| **Admin Dashboard** | `/admin` |
| **DB URL** | https://htztumtobwugrhrpjnsr.supabase.co |

---

## Need Help?

- 📖 See `DATABASE_MIGRATION_CLIENT_ADDRESS.md` for detailed migration info
- 📖 See `USER_MANAGEMENT_GUIDE.md` for user management documentation
- 📖 See `INICIO_RAPIDO_USUARIOS.md` for quick start (in Spanish)

---

**¡Listo para empezar!** 🚀
