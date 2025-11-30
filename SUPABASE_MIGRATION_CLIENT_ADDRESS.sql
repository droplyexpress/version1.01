-- Add address fields to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'ES';

-- Create comment for clarity
COMMENT ON COLUMN usuarios.direccion IS 'Client default pickup address (padron)';
COMMENT ON COLUMN usuarios.codigo_postal IS 'Client postal code (padron)';
COMMENT ON COLUMN usuarios.ciudad IS 'Client city (padron)';
COMMENT ON COLUMN usuarios.pais IS 'Client country (padron)';
