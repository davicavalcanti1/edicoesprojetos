-- Create inventory_sectors table
CREATE TABLE IF NOT EXISTS inventory_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_sectors ENABLE ROW LEVEL SECURITY;

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    sector_id UUID REFERENCES inventory_sectors(id),
    reason TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policies for Sectors
CREATE POLICY "Enable read access for admin and estoque" ON inventory_sectors FOR SELECT
USING (exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'estoque')));

CREATE POLICY "Enable write access for estoque" ON inventory_sectors FOR ALL
USING (exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'estoque'));

-- Policies for Movements
CREATE POLICY "Enable read access for admin and estoque" ON inventory_movements FOR SELECT
USING (exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role in ('admin', 'estoque')));

CREATE POLICY "Enable write access for estoque" ON inventory_movements FOR ALL
USING (exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'estoque'));

-- Function to handle stock updates on movement
CREATE OR REPLACE FUNCTION handle_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'IN' THEN
    UPDATE inventory_products
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'OUT' THEN
    UPDATE inventory_products
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic stock update
DROP TRIGGER IF EXISTS on_inventory_movement ON inventory_movements;
CREATE TRIGGER on_inventory_movement
AFTER INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_movement();
