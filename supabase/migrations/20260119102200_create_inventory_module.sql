-- 1. Add 'estoque' to app_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'app_role' AND e.enumlabel = 'estoque') THEN
        ALTER TYPE app_role ADD VALUE 'estoque';
    END IF;
END$$;

-- 2. Create inventory_products table
CREATE TABLE IF NOT EXISTS inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE inventory_products ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for admin and estoque users" ON inventory_products;
DROP POLICY IF EXISTS "Enable read access for admin and estoque" ON inventory_products;
DROP POLICY IF EXISTS "Enable write access for estoque only" ON inventory_products;

-- 5. Create Refined Policies

-- Read Access: Admin and Estoque can VIEW
CREATE POLICY "Enable read access for admin and estoque" ON inventory_products
  FOR SELECT
  USING (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
      and ur.role in ('admin', 'estoque')
    )
  );

-- Write Access: ONLY Estoque can INSERT, UPDATE, DELETE
CREATE POLICY "Enable write access for estoque only" ON inventory_products
  FOR ALL
  USING (
    exists (
      select 1 from user_roles ur
      where ur.user_id = auth.uid()
      and ur.role = 'estoque'
    )
  );
