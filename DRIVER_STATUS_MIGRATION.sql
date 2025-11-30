-- Add online_status column to usuarios table
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline'));

-- Add last_activity timestamp for tracking
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- Create index for faster queries on rol and online_status
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_online_status ON usuarios(rol, online_status);

-- Update existing drivers to offline initially
UPDATE usuarios SET online_status = 'offline' WHERE rol = 'repartidor';
