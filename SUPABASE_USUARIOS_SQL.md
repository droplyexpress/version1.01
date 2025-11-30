# SQL - Configuración de Usuarios con Roles - Droply Express

Ejecuta este SQL en tu proyecto de Supabase (SQL Editor).

## 1. Crear tabla `usuarios`

```sql
create table public.usuarios (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text unique not null,
  telefono text,
  rol text not null default 'cliente' check (rol in ('admin', 'cliente', 'repartidor')),
  vehiculo text,
  activo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.usuarios enable row level security;

-- Índices
create index usuarios_email on public.usuarios(email);
create index usuarios_rol on public.usuarios(rol);
create index usuarios_activo on public.usuarios(activo);
```

## 2. Actualizar tabla `orders` (si no está creada)

```sql
-- Si ya existe, agrega estas columnas:
-- ALTER TABLE public.orders ADD COLUMN client_id uuid REFERENCES public.usuarios(id);

-- Si no existe, créala:
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
  status text default 'pending'::text check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create index orders_client_id on public.orders(client_id);
create index orders_driver_id on public.orders(driver_id);
create index orders_status on public.orders(status);
create index orders_created_at on public.orders(created_at);
```

## 3. Datos de Prueba

```sql
-- 1. Crear admin
insert into public.usuarios (nombre, email, telefono, rol, activo) values
('Admin Droply', 'admin@droply.com', '+34 645 321 987', 'admin', true);

-- 2. Crear clientes
insert into public.usuarios (nombre, email, telefono, rol, activo) values
('Juan García', 'juan@example.com', '+34 612 345 678', 'cliente', true),
('María López', 'maria@example.com', '+34 623 456 789', 'cliente', true);

-- 3. Crear repartidores
insert into public.usuarios (nombre, email, telefono, rol, vehiculo, activo) values
('Carlos López', 'carlos@driver.com', '+34 687 654 321', 'repartidor', 'Furgoneta', true),
('Ana Martínez', 'ana@driver.com', '+34 698 765 432', 'repartidor', 'Moto', true);
```

## 4. Políticas de Row Level Security (RLS)

Para desarrollo (permisivo), ejecuta:

```sql
-- Permitir lectura a todos
create policy "Enable read access for all users" on public.usuarios
  as (select) using (true);

-- Permitir insert para crear usuarios
create policy "Enable insert for all" on public.usuarios
  as (insert) with check (true);

-- Permitir update
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

## Verificar que todo está correcto

Después de ejecutar el SQL, verifica en SQL Editor:

```sql
-- Ver todos los usuarios
select * from public.usuarios;

-- Contar usuarios por rol
select rol, count(*) as cantidad from public.usuarios group by rol;
```

Deberías ver:
- 1 admin
- 2 clientes
- 2 repartidores

---

## ✅ Listo para la App

Una vez ejecutado este SQL, la aplicación tendrá:
- Tabla de usuarios con roles
- Datos de prueba completos
- Control de acceso por rol
- Sistema de gestión de usuarios desde el admin

¡Continúa con la configuración en la app!
