-- Verify columns exist, if not create them
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- Update the check constraint if it doesn't exist
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_online_status_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_online_status_check CHECK (online_status IN ('online', 'offline'));

-- Create or replace RLS policy to allow users to update their own status
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio estado" ON usuarios;
CREATE POLICY "Usuarios pueden actualizar su propio estado" ON usuarios
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify admin can still update everything
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;
CREATE POLICY "Admins pueden actualizar usuarios" ON usuarios
  FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Grant necessary permissions
GRANT UPDATE ON usuarios TO authenticated;
GRANT UPDATE ON usuarios TO anon;

-- Verify the columns are in the table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name IN ('online_status', 'last_activity');
