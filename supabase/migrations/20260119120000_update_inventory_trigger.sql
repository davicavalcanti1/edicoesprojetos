-- Replace the existing trigger function to handle UPDATE and DELETE
CREATE OR REPLACE FUNCTION handle_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.type = 'IN' THEN
      UPDATE inventory_products
      SET quantity = quantity - OLD.quantity,
          updated_at = NOW()
      WHERE id = OLD.product_id;
    ELSIF OLD.type = 'OUT' THEN
      UPDATE inventory_products
      SET quantity = quantity + OLD.quantity,
          updated_at = NOW()
      WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Revert the OLD effect
    IF OLD.type = 'IN' THEN
      UPDATE inventory_products
      SET quantity = quantity - OLD.quantity
      WHERE id = OLD.product_id;
    ELSIF OLD.type = 'OUT' THEN
      UPDATE inventory_products
      SET quantity = quantity + OLD.quantity
      WHERE id = OLD.product_id;
    END IF;

    -- Apply the NEW effect
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

  -- Handle INSERT
  ELSIF (TG_OP = 'INSERT') THEN
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
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to be safe, though CREATE OR REPLACE handles the function
DROP TRIGGER IF EXISTS on_inventory_movement ON inventory_movements;

-- Recreate trigger to include UPDATE and DELETE
CREATE TRIGGER on_inventory_movement
AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_movement();
