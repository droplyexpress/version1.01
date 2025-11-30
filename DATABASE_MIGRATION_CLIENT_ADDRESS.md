# Database Migration - Client Address Fields (Padron)

This migration adds address fields to the `usuarios` table for client users (padron/default pickup address).

## What's New

When creating a **Cliente** user, administrators can now specify:
- **Dirección** - Full address (street, number, apartment)
- **Código Postal** - Postal/ZIP code
- **Ciudad** - City
- **País** - Country

This address is automatically used as the default pickup location when the client creates orders.

## Migration Steps

### Step 1: Add New Columns to `usuarios` Table

Go to your **Supabase Dashboard > SQL Editor** and run this SQL:

```sql
-- Add address fields to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'ES';

-- Create comment for clarity
COMMENT ON COLUMN usuarios.direccion IS 'Client default pickup address (padron)';
COMMENT ON COLUMN usuarios.codigo_postal IS 'Client postal code (padron)';
COMMENT ON COLUMN usuarios.ciudad IS 'Client city (padron)';
COMMENT ON COLUMN usuarios.pais IS 'Client country (padron)';
```

### Step 2: Verify the Migration

Check that the columns were created:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;
```

You should see:
- `direccion` (text)
- `codigo_postal` (text)
- `ciudad` (text)
- `pais` (text)

### Step 3: Update Existing Client Records (Optional)

If you have existing clients without address information, you can update them. Example:

```sql
-- Update a specific client with address
UPDATE usuarios 
SET 
  direccion = 'Calle Principal 123',
  codigo_postal = '28001',
  ciudad = 'Madrid',
  pais = 'ES',
  updated_at = NOW()
WHERE email = 'cliente@example.com' AND rol = 'cliente';
```

## Usage

### Creating a New Client

Admin panel now requires these fields when creating a **Cliente**:

1. Nombre
2. Email (login)
3. Teléfono
4. **Dirección** (new)
5. **Código Postal** (new)
6. **Ciudad** (new)
7. País (defaults to ES)

### Client Creates Order

When a client creates an order:
- **Pickup Address** is automatically populated from their padrón
- **Pickup Postal Code** is automatically populated from their padrón
- Client can modify both if needed for this specific order
- Address is displayed with a "Por defecto" (Default) badge

## Backend Changes

### Type Updates

**`shared/types.ts`**:
```typescript
export interface User {
  // ... existing fields
  direccion?: string | null;
  codigo_postal?: string | null;
  ciudad?: string | null;
  pais?: string | null;
}
```

**`client/types/supabase.ts`**:
- Updated `usuarios` table schema to include new columns

### Component Updates

**`CreateUserForm.tsx`**:
- Added address section when role is "Cliente"
- Fields only shown for client role
- Address fields are required for clients
- Country dropdown with common options

**`OrderForm.tsx`**:
- Pickup address now shows "Por defecto" badge
- Helper text indicates it comes from padrón
- Address can still be modified per order

## Rollback (If Needed)

If you need to remove these fields:

```sql
ALTER TABLE usuarios
DROP COLUMN IF EXISTS direccion,
DROP COLUMN IF EXISTS codigo_postal,
DROP COLUMN IF EXISTS ciudad,
DROP COLUMN IF EXISTS pais;
```

## Notes

- The address fields are nullable, so existing records won't be affected
- Admin panel will require address fields only when creating new **Cliente** users
- Existing clients without addresses will work fine - address is optional in the database
- Future enhancements can include importing addresses from postal code APIs
