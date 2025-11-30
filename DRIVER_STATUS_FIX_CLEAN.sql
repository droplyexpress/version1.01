ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_online_status_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_online_status_check CHECK (online_status IN ('online', 'offline'));

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio estado" ON usuarios;
CREATE POLICY "Usuarios pueden actualizar su propio estado" ON usuarios
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;
CREATE POLICY "Admins pueden actualizar usuarios" ON usuarios
  FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

GRANT UPDATE ON usuarios TO authenticated;
GRANT UPDATE ON usuarios TO anon;
