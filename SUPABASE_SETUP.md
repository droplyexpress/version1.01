# Supabase Database Setup - Droply Express

Para que la aplicación funcione correctamente, debes crear las siguientes tablas en tu proyecto de Supabase.

## 1. Tabla `users`

```sql
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  phone text,
  role text default 'client'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policy
alter table public.users enable row level security;
```

## 2. Tabla `orders`

```sql
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  client_id uuid not null references public.users(id) on delete cascade,
  driver_id uuid references public.users(id) on delete set null,
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
  status text default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policy
alter table public.orders enable row level security;

-- Índices
create index orders_client_id on public.orders(client_id);
create index orders_driver_id on public.orders(driver_id);
create index orders_status on public.orders(status);
create index orders_created_at on public.orders(created_at);
```

## 3. Tabla `drivers`

```sql
create table public.drivers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references public.users(id) on delete cascade,
  vehicle_type text,
  license_plate text,
  available boolean default true,
  current_location jsonb default null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policy
alter table public.drivers enable row level security;

-- Índice
create index drivers_user_id on public.drivers(user_id);
```

## 4. Datos de Prueba (Opcional)

### Crear un usuario cliente de prueba:

```sql
insert into public.users (email, name, phone, role) values
('cliente@example.com', 'Juan García', '+34 612 345 678', 'client');
```

Copiar el `id` del cliente creado y usarlo en los siguientes inserts.

### Crear un usuario repartidor de prueba:

```sql
insert into public.users (email, name, phone, role) values
('driver@example.com', 'Carlos López', '+34 687 654 321', 'driver');
```

Copiar el `id` del repartidor creado.

### Crear un usuario admin de prueba:

```sql
insert into public.users (email, name, phone, role) values
('admin@example.com', 'María García', '+34 645 321 987', 'admin');
```

### Crear un perfil de repartidor:

```sql
insert into public.drivers (user_id, vehicle_type, license_plate, available) values
('DRIVER_ID_AQUI', 'Furgoneta', 'ABC-1234', true);
```

### Crear un pedido de prueba:

```sql
insert into public.orders (
  order_number, client_id, driver_id, 
  pickup_address, pickup_postal_code, 
  delivery_address, delivery_postal_code,
  recipient_name, recipient_phone,
  pickup_date, pickup_time,
  delivery_date, delivery_time,
  notes, status
) values (
  'DRL00001', 'CLIENT_ID_AQUI', 'DRIVER_ID_AQUI',
  'Calle Principal 123', '28001',
  'Avenida Central 456', '28002',
  'Juan Pérez', '+34 666 123 456',
  '2024-01-15', '09:00',
  '2024-01-15', '14:00',
  'Dejar en recepción', 'pending'
);
```

## 5. Configurar Row Level Security (RLS)

Para que la app funcione correctamente, necesitas configurar RLS. Por ahora, para desarrollo, puedes deshabilitar RLS:

1. Ve a Authentication > Policies en tu dashboard de Supabase
2. Para cada tabla, crea una política que permita el acceso público (para desarrollo)

O usa estas políticas básicas:

```sql
-- Para tabla users
create policy "Enable read access for all users" on public.users as (select) using (true);

-- Para tabla orders
create policy "Enable read access for all users" on public.orders as (select) using (true);
create policy "Enable insert for authenticated users" on public.orders as (insert) with check (true);
create policy "Enable update for authenticated users" on public.orders as (update) using (true);

-- Para tabla drivers
create policy "Enable read access for all users" on public.drivers as (select) using (true);
```

## Variables de Entorno

Las siguientes variables ya están configuradas:

- `VITE_SUPABASE_URL`: https://htztumtobwugrhrpjnsr.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (configurada en .env)

## Próximos Pasos

1. Crea las tablas en Supabase usando el SQL anterior
2. Agrega datos de prueba (usuarios, pedidos, repartidores)
3. Configura las políticas de RLS
4. Prueba la app en los tres módulos (Admin, Cliente, Repartidor)

## Troubleshooting

Si ves errores de conexión:
1. Verifica que las variables de entorno estén configuradas correctamente
2. Comprueba que las tablas existen en Supabase
3. Verifica que Row Level Security esté configurado correctamente
4. Revisa la consola del navegador para ver los errores específicos
