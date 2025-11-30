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
