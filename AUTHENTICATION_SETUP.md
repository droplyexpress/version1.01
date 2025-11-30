# Droply Express - Authentication & User Management Setup

This guide explains how to set up and use the authentication system for Droply Express.

## Overview

The application uses **Supabase Authentication** integrated with a custom user management system:

- **Supabase Auth**: Handles login/password authentication and session management
- **Custom User Table (`usuarios`)**: Stores user profile data including roles, vehicle info, and status
- **Role-Based Access Control (RBAC)**: Three roles with different permissions:
  - **admin** - Full system access, can manage all users and orders
  - **cliente** - Can create and view their own orders
  - **repartidor** - Can view assigned orders and update delivery status

## Initial Setup

### 1. Create Admin User in Supabase

The first admin user should be created using Supabase's auth dashboard:

1. Go to your Supabase project > Authentication > Users
2. Click "Add user" and fill in:
   - **Email**: `admin@droply.com`
   - **Password**: `Admin123!` (or your preferred secure password)
   - **Confirm password**: Same as above
3. Click "Create user"

### 2. Create Admin User Profile

After creating the auth user, add their profile to the `usuarios` table:

```sql
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
);
```

## How Authentication Works

### Login Flow

1. User opens the application and is redirected to `/login`
2. User enters email and password
3. System authenticates with Supabase Auth
4. On successful login:
   - User session is established
   - User profile is fetched from `usuarios` table
   - User is redirected to their dashboard based on role:
     - **admin** → `/admin`
     - **cliente** → `/client`
     - **repartidor** → `/driver`

### Session Management

- Sessions are managed by Supabase (stored securely in browser)
- AuthContext listens for auth state changes
- Automatic redirect to login on session expiration
- User can manually logout from any dashboard

### Logout Flow

1. User clicks "Cerrar Sesión" button in header
2. Supabase session is cleared
3. User is redirected to login page
4. User can login again with new credentials

## Creating New Users (Admin Only)

The admin panel includes a user creation feature:

### Admin Interface

1. Navigate to Admin Dashboard (`/admin`)
2. Click on "Usuarios" tab
3. Click "Crear Nuevo Usuario" button
4. Fill in user details:
   - **Nombre** - Full name
   - **Email** - Unique email address
   - **Teléfono** - Phone number
   - **Rol** - Select user role
   - **Vehículo** - Required for repartidores only

### Behind the Scenes

When an admin creates a user:

1. **Generate Password**: A secure random password is generated (12+ characters, mixed case, numbers, special characters)
2. **Create Auth User**: User account is created in Supabase Auth with:
   - Email and generated password
   - Email automatically confirmed (no confirmation email needed)
3. **Create User Profile**: User record is added to `usuarios` table with all profile data
4. **Display Credentials**: A modal shows the credentials to share with the user:
   - Email
   - Generated password (displayed once only)
   - Role
5. **Security**: Admin must copy and securely share credentials - they cannot be retrieved later

## User Roles & Permissions

### Admin Role (`admin`)
- Access: `/admin` dashboard
- Permissions:
  - View all orders
  - View all users
  - Create new users (clientes and repartidores)
  - Manage user status (activate/deactivate)
  - Delete/deactivate users
  - Assign orders to drivers
  - Filter and search orders

### Client Role (`cliente`)
- Access: `/client` portal
- Permissions:
  - Create new orders
  - View own orders
  - Track order status in real-time
  - View order history
  - Cannot access admin panel or driver app

### Driver Role (`repartidor`)
- Access: `/driver` app
- Permissions:
  - View assigned orders
  - Update order status (picked up, in transit, delivered)
  - View delivery details
  - Cannot access admin panel or client portal
  - Cannot create or delete orders

## Security Considerations

### Password Security

- Passwords are generated randomly with high entropy
- Passwords are never stored in plaintext
- Passwords are only displayed once when creating a user
- Users should change their password on first login (future enhancement)

### Session Security

- Sessions are stored securely by Supabase
- Tokens expire after inactivity
- Users must re-authenticate after logout
- No sensitive data in localStorage

### Route Protection

- All authenticated routes are protected with `ProtectedRoute` component
- Unauthorized access redirects to login
- Role-based access control prevents access to wrong dashboards

### Data Access Control

Consider implementing Supabase Row Level Security (RLS) policies:
- Users can only view/edit their own orders
- Drivers can only see assigned orders
- Admins can see all data

Example RLS policy for `orders` table:
```sql
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = (SELECT auth_id FROM usuarios WHERE id = client_id)
    OR (SELECT rol FROM usuarios WHERE auth_id = auth.uid()) = 'admin'
  );
```

## Testing the System

### Demo Credentials

**Admin User:**
- Email: `admin@droply.com`
- Password: `Admin123!`

### Test Flow

1. Go to `/login`
2. Enter admin credentials
3. Should redirect to `/admin` dashboard
4. Create new test users (cliente and repartidor)
5. Logout and test login with new users
6. Verify each user can only access their appropriate dashboard

### Sample Test Users

After logging in as admin, create these test users:

**Test Client:**
- Nombre: Juan García
- Email: juan@example.com
- Teléfono: +34 612 345 678
- Rol: Cliente
- Password: (will be generated and displayed)

**Test Driver:**
- Nombre: Carlos López
- Email: carlos@example.com
- Teléfono: +34 625 123 456
- Rol: Repartidor
- Vehículo: Moto
- Password: (will be generated and displayed)

## Troubleshooting

### User Cannot Login

**Problem**: "Invalid login credentials"
- **Solution**: Verify email exists in `usuarios` table, ensure password is correct

**Problem**: "User not found in database"
- **Solution**: Check that user was added to `usuarios` table, not just auth system

### User Logged In But Dashboard is Blank

**Problem**: Page redirects or shows loading indefinitely
- **Solution**: Check browser console for errors, verify Supabase connection

**Problem**: User is redirected to `/login` immediately after login
- **Solution**: Check that user role is correctly set in `usuarios` table

### Password Reset

Current implementation doesn't include password reset. To add this:

1. Implement Supabase `resetPasswordForEmail()`
2. Create password reset page
3. Handle reset token from email link
4. Update `updateUserPassword()` in auth service

## Future Enhancements

1. **Password Reset**: Self-service password reset via email
2. **Two-Factor Authentication**: SMS or app-based 2FA
3. **Invite System**: Admin sends invite links instead of sharing passwords
4. **Audit Logging**: Track user actions for compliance
5. **Role Hierarchy**: More granular permissions (e.g., supervisor role)
6. **SSO Integration**: OAuth providers (Google, Microsoft, etc.)

## File Reference

- **Authentication Context**: `client/context/AuthContext.tsx`
- **Login Page**: `client/pages/Login.tsx`
- **Protected Routes**: `client/components/ProtectedRoute.tsx`
- **Auth Service**: `client/services/authService.ts`
- **Create User Form**: `client/components/CreateUserForm.tsx`
- **Auth Utilities**: `client/lib/auth-utils.ts`
- **Supabase Client**: `client/lib/supabase.ts`
