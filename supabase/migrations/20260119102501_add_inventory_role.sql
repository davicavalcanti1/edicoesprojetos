-- Step 1: Add the 'estoque' role
-- Run this script FIRST and ensure it completes successfully.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'app_role' AND e.enumlabel = 'estoque') THEN
        ALTER TYPE app_role ADD VALUE 'estoque';
    END IF;
END$$;
