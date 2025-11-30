-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(8) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_postal_code VARCHAR(10) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_postal_code VARCHAR(10) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Clientes pueden ver sus propios pedidos" ON orders
  FOR SELECT USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Repartidores pueden ver sus pedidos asignados" ON orders
  FOR SELECT USING (driver_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admins pueden ver todos los pedidos" ON orders
  FOR SELECT USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Clientes pueden crear pedidos" ON orders
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins pueden actualizar pedidos" ON orders
  FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Repartidores pueden actualizar sus pedidos" ON orders
  FOR UPDATE USING (driver_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));
