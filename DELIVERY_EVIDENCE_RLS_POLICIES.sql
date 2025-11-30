-- Enable RLS on delivery_evidence table
ALTER TABLE delivery_evidence ENABLE ROW LEVEL SECURITY;

-- Policy 1: Drivers can insert their own delivery evidence
CREATE POLICY "Drivers can insert delivery evidence"
ON delivery_evidence
FOR INSERT
WITH CHECK (
  auth.uid() = driver_id
);

-- Policy 2: Drivers can view their own delivery evidence
CREATE POLICY "Drivers can view their own evidence"
ON delivery_evidence
FOR SELECT
USING (
  auth.uid() = driver_id
);

-- Policy 3: Clients can view delivery evidence for their orders
CREATE POLICY "Clients can view evidence for their orders"
ON delivery_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = delivery_evidence.order_id
    AND orders.client_id = auth.uid()
  )
);

-- Policy 4: Admins can view all delivery evidence
CREATE POLICY "Admins can view all evidence"
ON delivery_evidence
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy 5: Storage bucket policy for delivery-evidence bucket
-- Run these in Supabase SQL Editor separately if needed:
-- CREATE POLICY "Public Read"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'delivery-evidence' AND auth.role() = 'authenticated');

-- CREATE POLICY "Drivers can upload evidence"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'delivery-evidence' AND auth.role() = 'authenticated');
