-- Add incident_reported status to orders
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'incident_reported', 'delivered', 'cancelled'));

-- Add column to track which incident is associated with current status
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS current_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL;

-- Create index for faster incident lookups
CREATE INDEX IF NOT EXISTS idx_orders_current_incident_id ON orders(current_incident_id);

-- Update incidents table to track the resolution decision
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS resolved_decision VARCHAR(50) CHECK (resolved_decision IN ('retry', 'return', 'reassign', 'waiting_client', NULL));
