-- Ensure maintenance_records has tenant_id and proper permissions for public inserts
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Enable RLS if not enabled
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/authenticated users to select (for dashboards) and insert (for opening tickets)
-- Policy for Inserting
CREATE POLICY "Public/Anon can insert maintenance_records" ON maintenance_records
FOR INSERT
WITH CHECK (true); -- Allow all inserts for now, or restrict if possible

-- Policy for Select (authenticated users only usually, but dashboard public might need access)
CREATE POLICY "Authenticated can view maintenance_records" ON maintenance_records
FOR SELECT
TO authenticated
USING (true); -- Or filter by tenant_id if multi-tenant logic enforced

-- Grant permissions
GRANT ALL ON maintenance_records TO anon;
GRANT ALL ON maintenance_records TO authenticated;
GRANT ALL ON maintenance_records TO service_role;
