# 🚀 Guía Completa de Setup - Droply Express con Sistema de Usuarios

## ✅ Lo que se ha implementado

### 1. **Base de Datos (Supabase)**
- ✓ Tabla `usuarios` con roles (admin, cliente, repartidor)
- ✓ Tabla `orders` conectada a usuarios
- ✓ Sistema de activación/desactivación de usuarios

### 2. **Backend**
- ✓ `userService.ts` - Servicio CRUD para usuarios
- ✓ `useUsers.ts` - Hooks de React Query para usuarios
- ✓ `AuthContext.tsx` - Context para gestionar usuario actual

### 3. **Componentes**
- ✓ `CreateUserForm.tsx` - Formulario para crear usuarios
- ✓ `UserManagementTable.tsx` - Tabla para gestionar usuarios
- ✓ Admin Dashboard actualizado con pestaña de usuarios

### 4. **Funcionalidades**
- ✓ Crear usuarios con roles (admin, cliente, repartidor)
- ✓ Activar/desactivar usuarios
- ✓ Eliminar usuarios
- ✓ Ver lista de usuarios por rol
- ✓ Gestión completa desde Admin Panel

---

## 🔧 PASO 1: Configurar la Base de Datos en Supabase

### 1.1 Crear tabla `usuarios`

Ve a tu proyecto de Supabase > **SQL Editor** y copia este SQL:

```sql
-- Tabla usuarios
create table public.usuarios (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text unique not null,
  telefono text,
  rol text not null default 'cliente' 
    check (rol in ('admin', 'cliente', 'repartidor')),
  vehiculo text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.usuarios enable row level security;

-- Índices para mejor performance
create index usuarios_email on public.usuarios(email);
create index usuarios_rol on public.usuarios(rol);
create index usuarios_activo on public.usuarios(activo);
```

Ejecuta el SQL (botón ▶️).

### 1.2 Crear tabla `orders` (si no existe)

```sql
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  client_id uuid not null references public.usuarios(id) on delete cascade,
  driver_id uuid references public.usuarios(id) on delete set null,
  pickup_address text not null,
  pickup_postal_code text not null,
  delivery_address text not null,
  delivery_postal_code text not null,
  recipient_name text not null,
  recipient_phone text not null,
  pickup_date text not null,
  pickup_time text not null,
  delivery_date text not null,
  delivery_time text not null,
  notes text,
  status text default 'pending'::text 
    check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create index orders_client_id on public.orders(client_id);
create index orders_driver_id on public.orders(driver_id);
create index orders_status on public.orders(status);
create index orders_created_at on public.orders(created_at);
```

### 1.3 Configurar Row Level Security (RLS)

Para desarrollo (permisivo), ejecuta esto:

```sql
-- Políticas para usuarios
create policy "Enable read access for all users" on public.usuarios
  as (select) using (true);

create policy "Enable insert for all" on public.usuarios
  as (insert) with check (true);

create policy "Enable update for all" on public.usuarios
  as (update) using (true);

-- Políticas para orders
create policy "Enable read access for orders" on public.orders
  as (select) using (true);

create policy "Enable insert for orders" on public.orders
  as (insert) with check (true);

create policy "Enable update for orders" on public.orders
  as (update) using (true);
```

---

## 📊 PASO 2: Agregar Datos de Prueba

En **SQL Editor**, ejecuta este SQL para crear usuarios de prueba:

```sql
-- 1. Administrador
insert into public.usuarios (nombre, email, telefono, rol, activo) 
values ('Admin Droply', 'admin@droply.com', '+34 645 321 987', 'admin', true);

-- 2. Clientes
insert into public.usuarios (nombre, email, telefono, rol, activo) 
values 
('Juan García', 'juan@example.com', '+34 612 345 678', 'cliente', true),
('María López', 'maria@example.com', '+34 623 456 789', 'cliente', true);

-- 3. Repartidores
insert into public.usuarios (nombre, email, telefono, rol, vehiculo, activo) 
values 
('Carlos López', 'carlos@driver.com', '+34 687 654 321', 'repartidor', 'Furgoneta', true),
('Ana Martínez', 'ana@driver.com', '+34 698 765 432', 'repartidor', 'Moto', true);
```

### Verificar datos

```sql
-- Ver todos los usuarios
select id, nombre, email, rol, vehiculo, activo from public.usuarios;

-- Contar por rol
select rol, count(*) as cantidad from public.usuarios group by rol;
```

Deberías ver:
- ✓ 1 admin
- ✓ 2 clientes
- ✓ 2 repartidores

---

## 🎮 PASO 3: Usar la App

### Admin Panel (`/admin`)

1. Ve a [http://localhost:8080/admin](/admin)
2. **Pestaña "Usuarios"** - Ver todos los usuarios
3. **Crear Nuevo Usuario** - Botón para agregar usuarios
4. **Activar/Desactivar** - Click en toggle
5. **Eliminar** - Click en basura

### Cliente (`/client`)

1. Ve a [http://localhost:8080/client](/client)
2. Crea pedidos con datos de prueba
3. Ver estado en tiempo real

### Repartidor (`/driver`)

1. Ve a [http://localhost:8080/driver](/driver)
2. Ver pedidos asignados
3. Actualizar estado (Recogido → En tránsito → Entregado)

---

## 🔑 Usuarios de Prueba

**Admin:**
- Email: admin@droply.com
- Rol: admin
- Acceso completo

**Cliente 1:**
- Email: juan@example.com
- Rol: cliente
- Crear y ver pedidos

**Cliente 2:**
- Email: maria@example.com
- Rol: cliente
- Crear y ver pedidos

**Repartidor 1:**
- Email: carlos@driver.com
- Rol: repartidor
- Vehículo: Furgoneta

**Repartidor 2:**
- Email: ana@driver.com
- Rol: repartidor
- Vehículo: Moto

---

## 📋 Funcionalidades Implementadas

### Admin
- ✅ Ver todos los usuarios
- ✅ Crear nuevos usuarios (cliente, repartidor, admin)
- ✅ Activar/desactivar usuarios
- ✅ Eliminar usuarios
- ✅ Estadísticas por rol
- ✅ Ver y filtrar pedidos
- ✅ Asignar repartidores a pedidos

### Cliente
- ✅ Ver sus pedidos
- ✅ Estado del envío en tiempo real
- ✅ Crear nuevos pedidos
- ✅ Historial de entregas

### Repartidor
- ✅ Ver pedidos asignados
- ✅ Actualizar estado del pedido
- ✅ Ver información del cliente
- ✅ Dirección de entrega

---

## 🔗 Flujo de Datos

```
1. Admin crea usuario
   ├─> CreateUserForm captura datos
   ├─> userService.createUser() inserta en Supabase
   └─> UserManagementTable actualiza lista

2. Cliente crea pedido
   ├─> OrderForm captura datos
   ├─> orderService.createOrder() inserta en Supabase
   └─> Admin ve el nuevo pedido

3. Admin asigna repartidor
   ├─> useAssignDriver() actualiza order
   └─> Repartidor ve el pedido asignado

4. Repartidor actualiza estado
   ├─> useUpdateOrderStatus() cambia status
   ├─> Admin ve cambio en tiempo real
   └─> Cliente recibe actualización
```

---

## 🐛 Troubleshooting

### Error: "Relation usuarios does not exist"
**Solución:** Las tablas no se han creado en Supabase
- Ve a SQL Editor en Supabase
- Copia el SQL de este archivo
- Ejecuta las consultas

### No veo los usuarios en la app
**Solución:** Verifica que:
1. Las tablas existan en Supabase
2. Haya datos de prueba (ejecuta el INSERT)
3. Las credenciales estén en `.env.local`
4. Abre DevTools (F12) > Console para ver errores

### Los datos no se actualizan
**Solución:** Los datos se actualizan cada 5-10 segundos automáticamente. Si no funciona:
1. Recarga la página (F5)
2. Comprueba la pestaña Network en DevTools
3. Verifica que Supabase esté respondiendo

---

## 📁 Archivos Creados

```
client/
├── services/
│   └── userService.ts              # CRUD de usuarios
├── hooks/
│   └── useUsers.ts                 # React Query hooks
├── context/
│   └── AuthContext.tsx             # Context de auth/rol
├── components/
│   ├── CreateUserForm.tsx          # Formulario crear usuario
│   └── UserManagementTable.tsx     # Tabla de gestión
└── pages/
    └── admin/
        └── Dashboard.tsx           # Admin actualizado

shared/
└── types.ts                        # Tipos con usuarios
```

---

## ✨ Próximas Mejoras

1. **Autenticación Real** - Supabase Auth en vez de localStorage
2. **Google Maps** - Integración para rutas
3. **Fotos** - Captura de fotos en entregas
4. **Notificaciones Push** - Firebase Cloud Messaging
5. **Reportes** - Generación de PDF/Excel

---

## 🚀 Resumen

La app ya tiene:
- ✅ Sistema de usuarios con roles
- ✅ Admin panel para gestionar usuarios
- ✅ Creación/edición/eliminación de usuarios
- ✅ Integración con Supabase
- ✅ Datos de prueba listos

Solo necesitas:
1. Ejecutar el SQL en Supabase (5 minutos)
2. Agregar datos de prueba (2 minutos)
3. ¡Probar la app!

¡Todo está listo! 🎉
