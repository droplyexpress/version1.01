-- Add DELETE policy for admins to delete orders
CREATE POLICY "Admins pueden eliminar pedidos" ON orders
  FOR DELETE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));
