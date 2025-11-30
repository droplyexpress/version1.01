# ✅ Setup Checklist - Admin Configuration

## Status: Ready for Admin Activation

### ✅ Completed Tasks

#### 1. Updated Admin Credentials in Login Page
- **File**: `client/pages/Login.tsx`
- **Status**: ✅ Complete
- **What changed**: Login page now displays new admin credentials
- **Details**:
  - Email: `manolo@droplyexpress.com`
  - Password: `M@n251428`

#### 2. Created Database Migration Service
- **File**: `server/services/migrationService.ts`
- **Status**: ✅ Complete
- **What it does**:
  - Executes SQL to add address columns to `usuarios` table
  - Creates/updates admin user in Supabase Auth
  - Provides functions for individual operations or complete setup

#### 3. Created Migration API Routes
- **File**: `server/routes/migration.ts`
- **Status**: ✅ Complete
- **Available endpoints**:
  - `POST /api/migration/execute-migration` - Run SQL migration only
  - `POST /api/migration/create-admin` - Create admin user only
  - `POST /api/migration/setup` - Run both migration and admin creation

#### 4. Created Client-Side API Utility
- **File**: `client/lib/migration-api.ts`
- **Status**: ✅ Complete
- **Functions**:
  - `executeMigration()` - Call migration endpoint
  - `createAdmin(email, password, name)` - Create admin user
  - `executeSetup(email, password, name)` - Complete setup

#### 5. Created Admin Setup Wizard Component
- **File**: `client/components/AdminSetupWizard.tsx`
- **Status**: ✅ Complete
- **Features**:
  - Step 1: Guides user to get Supabase Service Role Secret
  - Step 2: Executes the setup with the secret
  - Step 3: Confirms successful setup

#### 6. Created Setup Page
- **File**: `client/pages/Setup.tsx`
- **Status**: ✅ Complete
- **Route**: `/setup`
- **Purpose**: Hosts the admin setup wizard

#### 7. Updated App Router
- **File**: `client/App.tsx`
- **Status**: ✅ Complete
- **Change**: Added `/setup` route to application

#### 8. Created Admin Setup Guide
- **File**: `ADMIN_SETUP_GUIDE.md`
- **Status**: ✅ Complete
- **Contains**:
  - Step-by-step instructions to get Service Role Secret
  - How to set environment variable
  - API endpoint reference
  - Troubleshooting guide

---

## ⏳ Next Steps for User

### Step 1: Get Supabase Service Role Secret
1. Go to Supabase Dashboard: https://supabase.io/dashboard
2. Select Droply Express project
3. Click Settings (⚙️) → API
4. Copy "Service Role Secret" (second key)
5. Keep it safe and confidential

### Step 2: Choose Your Setup Method

#### Option A: Use the Setup Wizard (Easiest)
1. Go to your app's `/setup` page
2. Follow the wizard step-by-step
3. Paste your Service Role Secret
4. Click "Execute Setup"
5. You're done! ✅

#### Option B: Use the API Directly
```bash
curl -X POST http://localhost:3000/api/migration/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manolo@droplyexpress.com",
    "password": "M@n251428",
    "name": "Admin Master"
  }'
```

#### Option C: Execute SQL Manually
1. Go to Supabase SQL Editor
2. Copy the migration SQL from `SUPABASE_MIGRATION_CLIENT_ADDRESS.sql`
3. Run the SQL
4. Go to Auth → Users
5. Create user: manolo@droplyexpress.com / M@n251428

### Step 3: Verify the Setup
1. Go to `/login`
2. Login with: manolo@droplyexpress.com / M@n251428
3. You should see the Admin Dashboard
4. Success! ✅

---

## 📋 Database Migration Details

### SQL to be Executed

```sql
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'ES';

COMMENT ON COLUMN usuarios.direccion IS 'Client default pickup address (padron)';
COMMENT ON COLUMN usuarios.codigo_postal IS 'Client postal code (padron)';
COMMENT ON COLUMN usuarios.ciudad IS 'Client city (padron)';
COMMENT ON COLUMN usuarios.pais IS 'Client country (padron)';
```

### What It Does
- Adds 4 new columns to track client address information
- These are used as default pickup addresses when clients create orders
- Countries default to 'ES' (Spain)

---

## 🔐 Admin User Details

| Field | Value |
|-------|-------|
| **Email** | manolo@droplyexpress.com |
| **Password** | M@n251428 |
| **Role** | admin |
| **Status** | Active |
| **Access** | Full admin dashboard access |

---

## 🗂️ File Structure Summary

```
New/Modified Files:
├── server/
│   ├── services/
│   │   └── migrationService.ts          (NEW - Migration logic)
│   ├── routes/
│   │   └── migration.ts                 (NEW - API endpoints)
│   └── index.ts                         (MODIFIED - Added routes)
├── client/
│   ├── pages/
│   │   ├── Setup.tsx                    (NEW - Setup page)
│   │   └── Login.tsx                    (MODIFIED - Updated credentials)
│   ├── components/
│   │   └── AdminSetupWizard.tsx         (NEW - Setup wizard)
│   ├── lib/
│   │   └── migration-api.ts             (NEW - API client)
│   └── App.tsx                          (MODIFIED - Added /setup route)
├── ADMIN_SETUP_GUIDE.md                 (NEW - Comprehensive guide)
└── SETUP_CHECKLIST.md                   (THIS FILE)
```

---

## 🚀 Quick Start for Impatient Users

1. **Get your Service Role Secret** from Supabase
2. **Go to `/setup` page** in your app
3. **Follow the wizard** (3 steps, 2 minutes)
4. **Done!** Login with `manolo@droplyexpress.com`

---

## ❓ FAQ

**Q: What if the setup wizard doesn't work?**
A: Use Option B (API) or Option C (Manual SQL) from Step 2 above.

**Q: Is my Service Role Secret safe?**
A: It's passed directly to your backend for one-time use. Don't commit it to git.

**Q: Can I change the admin password later?**
A: Yes, via Supabase Auth dashboard or by updating the user.

**Q: What if I lose the password?**
A: You can reset it in Supabase Auth dashboard.

**Q: Can I have multiple admins?**
A: Yes, create more users with `admin` role.

---

## 📞 Support

- **Setup Guide**: See `ADMIN_SETUP_GUIDE.md`
- **Migration Details**: See `SUPABASE_MIGRATION_CLIENT_ADDRESS.sql`
- **User Management**: See `USER_MANAGEMENT_GUIDE.md`
- **Quick Start**: See `INICIO_RAPIDO_USUARIOS.md` (Spanish)

---

## ✨ What's Next After Setup?

1. ✅ Login to admin dashboard
2. 📝 Create your first client user
3. 👤 Create driver users
4. 📦 Create and manage orders
5. 🗺️ Track deliveries

---

**You're almost there! 🎉**
