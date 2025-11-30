# 👤 Crear Administrador Master - Guía Paso a Paso

## Resumen
Necesitas crear el usuario `manolo@droplyexpress.com` en Supabase Auth y luego registrarlo en la tabla `usuarios`.

---

## 📋 Paso 1: Crear el Usuario en Supabase Auth

### Método A: Vía Dashboard Supabase (Recomendado)

1. Ve a tu **Supabase Dashboard**: https://supabase.io/dashboard
2. Selecciona tu proyecto **Droply Express**
3. Haz clic en **Authentication** en el menú izquierdo
4. Haz clic en **Users**
5. Haz clic en **Add User** (botón verde arriba a la derecha)

En el modal que aparece:
- **Email**: `manolo@droplyexpress.com`
- **Password**: `M@n251428`
- **Email confirmed**: Marca esta casilla ✓

6. Haz clic en **Create User**

✅ El usuario de auth ha sido creado

---

## 📋 Paso 2: Registrar el Admin en la Tabla `usuarios`

### Método A: SQL Editor (Recomendado)

1. Ve a tu **Supabase Dashboard**
2. Haz clic en **SQL Editor** en el menú izquierdo
3. Haz clic en **New Query**
4. Copia y pega el siguiente SQL:

```sql
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
```

5. Haz clic en **Run** (botón de play ▶️)

✅ El usuario admin ha sido registrado en la base de datos

---

## ✅ Verificar que Todo Funciona

En el mismo SQL Editor, ejecuta:

```sql
SELECT id, nombre, email, rol, activo, created_at 
FROM public.usuarios 
WHERE email = 'manolo@droplyexpress.com';
```

Deberías ver un resultado como este:

| id | nombre | email | rol | activo | created_at |
|---|---|---|---|---|---|
| `uuid-aqui` | Admin Master | manolo@droplyexpress.com | admin | true | 2024-01-15... |

---

## 🔑 Ahora Puedes Iniciar Sesión

1. Ve a tu aplicación: `/login`
2. Introduce:
   - **Email**: `manolo@droplyexpress.com`
   - **Contraseña**: `M@n251428`
3. Haz clic en **Iniciar Sesión**

Si todo está correcto, deberías entrar en el **Admin Dashboard** ✅

---

## ❌ ¿Algo Salió Mal?

### Error: "Invalid login credentials"
- Verifica que el usuario fue creado correctamente en **Authentication → Users**
- Asegúrate de que la contraseña es exactamente: `M@n251428`

### Error: "Email not found"
- Primero crea el usuario en Auth (Paso 1)
- Luego ejecuta el SQL (Paso 2)

### Error al ejecutar SQL: "relation usuarios does not exist"
- La tabla `usuarios` no existe
- Necesitas ejecutar la migración de creación de tabla primero:

```sql
create table public.usuarios (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text unique not null,
  telefono text,
  rol text not null default 'cliente' check (rol in ('admin', 'cliente', 'repartidor')),
  vehiculo text,
  activo boolean default true,
  direccion text,
  codigo_postal text,
  ciudad text,
  pais text default 'ES',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.usuarios enable row level security;
create index usuarios_email on public.usuarios(email);
create index usuarios_rol on public.usuarios(rol);
create index usuarios_activo on public.usuarios(activo);
```

### El usuario se creó pero no puedo iniciar sesión
- Verifica que el usuario está en la tabla `usuarios` con `rol = 'admin'`
- Verifica que `activo = true`
- Intenta nuevamente o cierra sesión del navegador y vuelve a intentar

---

## 📄 Datos del Admin Master

| Campo | Valor |
|-------|-------|
| **Nombre** | Admin Master |
| **Email** | manolo@droplyexpress.com |
| **Contraseña** | M@n251428 |
| **Teléfono** | +34 612 345 678 |
| **Rol** | admin |
| **Activo** | Sí |

---

## 🚀 Próximos Pasos

Una vez inicies sesión como admin:

1. ✅ **Dashboard Admin** - Verás el panel de control
2. 📝 **Crear Usuarios** - Crea clientes y repartidores
3. 📦 **Gestionar Pedidos** - Crea y asigna pedidos
4. 👥 **Gestionar Usuarios** - Edita y actualiza usuarios

---

## 💡 Archivo SQL Completo

Todo el SQL lo tienes en el archivo: `ADMIN_MASTER_SETUP.sql`

---

**¡Listo! Ahora deberías poder iniciar sesión como administrador master.** 🎉
