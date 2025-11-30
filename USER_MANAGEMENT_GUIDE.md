# User Management & Authentication Guide

## Overview

Droply Express now has a complete user management system with:
- ✅ Authentication (login/password)
- ✅ Role-based access control (Admin, Cliente, Repartidor)
- ✅ User creation with automatic access credentials
- ✅ Client address profiles (padron) for default pickup locations
- ✅ Automatic address population in orders

## System Architecture

### User Roles

#### 1. **Admin (Administrador)**
- **Access**: Admin Dashboard (`/admin`)
- **Capabilities**:
  - View all orders
  - Create new users (any role)
  - Manage user status (activate/deactivate)
  - Delete users
  - Assign drivers to orders
  - View statistics
- **Login**: Email + Password (created by previous admin or initially set up)

#### 2. **Client (Cliente)**
- **Access**: Client Portal (`/client`)
- **Capabilities**:
  - Create orders
  - View their own orders
  - Track delivery status
  - View order history
- **Profile Data**: 
  - Name, Email, Phone
  - **Padron (Default Pickup Address)**:
    - Full address
    - Postal code
    - City
    - Country
- **Login**: Email + Password (created by admin)

#### 3. **Driver (Repartidor)**
- **Access**: Driver App (`/driver`)
- **Capabilities**:
  - View assigned orders
  - Update order status
  - Mark deliveries as complete
- **Profile Data**:
  - Name, Email, Phone
  - Vehicle type (required)
- **Login**: Email + Password (created by admin)

## User Creation Workflow

### Prerequisites
- You must be logged in as Admin
- Database has been migrated with address fields (see DATABASE_MIGRATION_CLIENT_ADDRESS.md)

### Step 1: Access User Management

1. Login as Admin at `/login`
   - Email: `admin@droply.com`
   - Password: `Admin123!`
2. Navigate to Admin Dashboard (`/admin`)
3. Click on **"Usuarios"** tab
4. Click **"Crear Nuevo Usuario"** button

### Step 2: Fill User Information

#### For ALL Users (Required):
- **Nombre Completo** - Full name
- **Email** - Will be used as login (must be unique)
- **Teléfono** - Contact phone number
- **Rol** - Select: Cliente, Repartidor, or Administrador

#### For Repartidores (Required):
- **Tipo de Vehículo** - Select: Bicicleta, Moto, Coche, Furgoneta, Camión

#### For Clientes ONLY (Required - Padron):
- **Dirección Completa** - Full street address
- **Código Postal** - ZIP/Postal code
- **Ciudad** - City name
- **País** - Country (defaults to Spain)

### Step 3: Review Generated Credentials

After form submission:
1. Modal shows **Email** and **Password** (generated randomly)
2. Each field has a **Copy** button
3. "Copiar Todo" copies Email and Password together
4. **⚠️ Important**: These are the ONLY credentials the user will receive

### Step 4: Share Credentials Securely

- Copy the credentials
- Send via **secure channel** (not via plain email):
  - In-person
  - Encrypted email
  - Password manager
  - Secure messaging app

## User Login Flow

### First Time Login
1. User goes to application home (`/`)
2. Clicks **"Iniciar Sesión"** or goes to `/login`
3. Enters **Email** and **Password** provided by admin
4. Click **"Iniciar Sesión"**
5. Automatically redirected to their role dashboard:
   - **Admin** → `/admin`
   - **Cliente** → `/client`
   - **Repartidor** → `/driver`

### Session Management
- Sessions are secure and managed by Supabase
- User can logout anytime (button in header)
- Sessions persist across page refreshes
- Sessions expire after 24 hours of inactivity

## Client Padron (Default Address)

### Why Padron?
Spanish term for a client's default address, used as the automatic pickup location for their orders.

### Setting Up Client Padron
When creating a **Cliente** user:

```
📍 Dirección de Recogida (Padrón)
   ├─ Dirección Completa: "Calle Principal 123, Apto 4B"
   ├─ Código Postal: "28001"
   ├─ Ciudad: "Madrid"
   └─ País: "España"
```

### Using Padron in Orders
When a client creates an order:

1. **Pickup Address** section shows:
   - Address field pre-filled with padrón address
   - **"Por defecto"** (Default) badge
   - Helper text: "Dirección de recogida predeterminada de tu padrón"

2. Client can:
   - ✅ Use the padrón address as-is
   - ✅ Modify it for this specific order
   - ✅ Keep the modification for this order only

3. **Postal Code** also pre-filled from padrón

### Changing Padron Address
Currently, clients cannot self-modify their padrón. To change:
1. Admin must edit the user
2. Update address fields
3. Changes apply to future orders

(Self-service edit coming in future update)

## User Management Table

The **Usuarios** tab shows all users with columns:

| Column | Description |
|--------|-------------|
| **Nombre** | User's full name |
| **Email** | Login email |
| **Rol** | User's role (Admin/Cliente/Repartidor) |
| **Vehículo** | Vehicle type (only for drivers) |
| **Estado** | Activo/Inactivo |
| **Acciones** | Deactivate or Delete |

### Actions

**Desactivar (Deactivate)**:
- User account is disabled
- They cannot login
- Can be reactivated later
- Order data is preserved

**Eliminar (Delete)**:
- Soft delete (user stays in system but inactive)
- Cannot be undone
- Order data is preserved
- User cannot login

## Database Schema

### usuarios Table

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  rol TEXT DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente', 'repartidor')),
  vehiculo TEXT, -- Only for repartidores
  
  -- Client padron fields
  direccion TEXT, -- Full address
  codigo_postal TEXT, -- ZIP/Postal code
  ciudad TEXT, -- City name
  pais TEXT DEFAULT 'ES', -- Country code
  
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Troubleshooting

### Login Fails: "Email o contraseña incorrectos"
- ✅ Check email is spelled correctly (case-insensitive)
- ✅ Check password is exact (case-sensitive)
- ✅ Verify admin created user's email in the system
- ✅ Check user is "Activo" (not deactivated)

### User Cannot Access Their Dashboard
- ✅ Verify correct role is assigned
- ✅ Check user status is "Activo"
- ✅ Try logging out and back in
- ✅ Clear browser cache and cookies

### Client Address Not Showing in Order
- ✅ Verify client was created with address fields
- ✅ Check SQL migration was applied (DATABASE_MIGRATION_CLIENT_ADDRESS.md)
- ✅ Verify address fields have data in database

### Cannot Create User: "Email already registered"
- ✅ Email already exists (check Users list)
- ✅ Use a different email address
- ✅ Admin can delete the old account if needed

## Security Best Practices

### For Admins
✅ DO:
- Use strong passwords for admin account
- Share user credentials securely (not plain email)
- Regularly review active users
- Deactivate unused accounts

❌ DON'T:
- Share admin login credentials
- Write passwords in plain text
- Use same password across platforms
- Leave admin account unattended

### For Users
✅ DO:
- Change auto-generated password on first login (future feature)
- Keep email and password confidential
- Logout when finished
- Report suspicious activity

❌ DON'T:
- Share login credentials
- Use weak passwords
- Reuse passwords from other accounts
- Leave logged-in sessions unattended

## API & Database

### Supabase Setup
- Auth: Supabase Authentication (email/password)
- Database: PostgreSQL
- RLS: Row Level Security (future implementation)

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Future Enhancements

Planned improvements:
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Email verification on signup
- [ ] Client self-edit padron address
- [ ] Driver license/vehicle verification
- [ ] Admin audit logs
- [ ] Bulk user import/export
- [ ] OAuth/SSO integration
- [ ] Role permissions customization
- [ ] Address autocomplete from postal API

## Support & Questions

For issues or questions:
1. Check this guide (you're reading it!)
2. Review DATABASE_MIGRATION_CLIENT_ADDRESS.md for setup
3. Check AUTHENTICATION_SETUP.md for detailed auth info
4. Contact your system administrator

---

**Last Updated**: 2024
**Version**: 1.0
