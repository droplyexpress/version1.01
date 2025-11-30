-- Allow drivers to update the status of their assigned orders
-- Run this in Supabase SQL Editor if the policy doesn't exist yet

-- First, drop the old policy if it exists (optional, for clean update)
DROP POLICY IF EXISTS "Repartidores pueden actualizar sus pedidos" ON orders;

-- Create the new policy that allows drivers to update their assigned orders
CREATE POLICY "Drivers can update their assigned orders"
  ON orders FOR UPDATE
  USING (
    driver_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  )
  WITH CHECK (
    driver_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Drivers can update their assigned orders';
