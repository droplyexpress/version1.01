# Configuración de Supabase Storage para Evidencia de Entrega

## Paso 1: Crear el Bucket

1. En Supabase, ve a **Storage** → **Buckets**
2. Haz clic en **+ New bucket**
3. Nombre: `delivery-evidence`
4. Marca **Public bucket** ✅
5. Haz clic en **Create bucket**

---

## Paso 2: Configurar Políticas RLS (Row Level Security)

Este es el paso importante que probablemente falta.

1. En **Storage**, abre el bucket `delivery-evidence`
2. Haz clic en la pestaña **Policies**
3. Haz clic en **+ New Policy**

### Policy 1: Permitir upload para usuarios autenticados

Selecciona:
- **Operation**: INSERT
- **Authentication**: ��� Authenticated users
- **Target role**: authenticated

En la sección **With check expression**, coloca:

```sql
true
```

Haz clic en **Review** → **Save policy**

### Policy 2: Permitir lectura pública

Selecciona:
- **Operation**: SELECT
- **Authentication**: ✅ Public
- **Target role**: authenticated

En la sección **With check expression**, coloca:

```sql
true
```

Haz clic en **Review** → **Save policy**

---

## Paso 3: Ejecuta el SQL de la tabla

En **SQL Editor**, copia y ejecuta esto:

```sql
-- Crear tabla para la evidencia de entrega
CREATE TABLE IF NOT EXISTS delivery_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  recipient_id_number TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_delivery_evidence_order_id ON delivery_evidence(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_evidence_driver_id ON delivery_evidence(driver_id);
```

---

## Solución de Problemas

Si aún da error al finalizar la entrega:

1. **Abre la consola del navegador** (F12)
2. **Tab Console**
3. Intenta finalizar la entrega de nuevo
4. Copia exactamente el error que sale
5. Comparte el error

Los errores comunes son:
- ❌ `403 Forbidden` → Falta política RLS en Storage
- ❌ `Bucket not found` → No creaste el bucket
- ❌ `No such table` → Falta ejecutar el SQL
