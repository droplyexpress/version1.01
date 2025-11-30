# ⚡ Inicio Rápido - Gestión de Usuarios con Padrón

## En 3 Pasos

### 1️⃣ Ejecutar Migración SQL (Solo una vez)

Ve a **Supabase Dashboard** → **SQL Editor** y copia/pega esto:

```sql
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'ES';
```

Ejecuta. ✅ Hecho!

### 2️⃣ Login como Admin

- Ve a `/login`
- Email: `admin@droply.com`
- Password: `Admin123!`

### 3️⃣ Crear tu Primer Cliente

1. Dashboard → Pestaña "Usuarios"
2. Click "Crear Nuevo Usuario"
3. Rellena:
   - Nombre: "Juan García"
   - Email: "juan@example.com"
   - Teléfono: "+34 612 345 678"
   - Rol: **"Cliente"** ← Selecciona esto
4. Verás nuevos campos:
   - Dirección: "Calle Principal 123"
   - Código Postal: "28001"
   - Ciudad: "Madrid"
   - País: "España"
5. Click "Crear Usuario y Asignar Acceso"
6. **Modal**: Muestra email y contraseña generada
7. Copia y comparte con el cliente

## Que Sucede Ahora

✅ **Usuario Creado**: Tiene acceso al sistema
✅ **Padrón Guardado**: Su dirección de recogida por defecto
✅ **Pedidos Automáticos**: Cuando cree un pedido, dirección ya viene rellena

## Crear Repartidor

Mismo proceso pero:
- Rol: "Repartidor"
- Sin campos de dirección
- **Requiere**: Tipo de Vehículo

## Crear Admin

Mismo proceso pero:
- Rol: "Administrador"
- Sin campos requeridos adicionales

## Flujo Cliente → Pedido

```
1. Cliente recibe: email + contraseña
2. Va a /login → Introduce credenciales
3. Entra a Portal Cliente (/client)
4. Click "Nuevo Pedido"
5. Campo "Dirección de recogida (Padrón)" pre-relleno ✅
6. Puede modificar o usar así
7. Crea el pedido
```

## Credenciales de Cliente Ejemplo

```
Email: juan@example.com
Contraseña: aB3$Xm9pQ2nL8@Rx
Rol: Cliente

Padrón:
├─ Dirección: Calle Principal 123
├─ Código Postal: 28001
├─ Ciudad: Madrid
└─ País: España

Cuando crea pedido → Dirección auto-rellena en "Recogida"
```

## Usuarios Existentes

¿Tienes usuarios creados sin dirección?
- ✅ Funcionan normal
- ✅ Pueden creatpedidos si son clientes
- ✅ Admin puede agregar dirección después

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Dirección no aparece en pedido | Verify SQL migration ejecutado |
| No puedo crear cliente sin dirección | Es requerido - rellena todos los campos |
| Usuario no puede entrar | Verifica email y contraseña exacto |
| "Email ya registrado" | Email ya existe - usa uno diferente |

## Documentación Completa

- **CAMBIOS_IMPLEMENTADOS.md** - Detalle de qué cambió
- **USER_MANAGEMENT_GUIDE.md** - Guía completa con todo
- **DATABASE_MIGRATION_CLIENT_ADDRESS.md** - SQL detallado

## ¿Preguntas?

1. ¿Los repartidores necesitan dirección? **No**
2. ¿Puede el cliente cambiar su padrón? **No (aún)**
3. ¿Dónde veo todos los usuarios? **Admin → Usuarios tab**
4. ¿Cómo cambio la contraseña de un usuario? **Admin crea nuevo con nuevo email**

---

**¡Ya está! Comienza a crear usuarios.** 🚀
