-- Create incidents table for tracking order issues
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
    'package_not_ready',
    'recipient_unavailable',
    'wrong_address',
    'damaged_package',
    'other'
  )),
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  admin_notes TEXT,
  resolved_action VARCHAR(50) CHECK (resolved_action IN ('retry', 'reschedule', 'cancel', 'contact_client')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_incidents_order_id ON incidents(order_id);
CREATE INDEX IF NOT EXISTS idx_incidents_driver_id ON incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drivers can see their own incidents
CREATE POLICY "Drivers can see their own incidents" ON incidents
  FOR SELECT USING (driver_id = auth.uid());

-- Admins can see all incidents
CREATE POLICY "Admins can see all incidents" ON incidents
  FOR SELECT USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Drivers can create incidents
CREATE POLICY "Drivers can create incidents" ON incidents
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Admins can update incidents
CREATE POLICY "Admins can update incidents" ON incidents
  FOR UPDATE USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Drivers can update their own incidents (add notes/photos)
CREATE POLICY "Drivers can update their own incidents" ON incidents
  FOR UPDATE USING (driver_id = auth.uid());
