-- Migration to add new enum values safely
-- Run this file ALONE and verify success before running other migrations.

DO $$
BEGIN
    -- Add 'rh' to app_role
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'app_role' AND e.enumlabel = 'rh') THEN
        ALTER TYPE app_role ADD VALUE 'rh';
    END IF;

    -- Add 'paciente' to occurrence_type
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'occurrence_type' AND e.enumlabel = 'paciente') THEN
        ALTER TYPE occurrence_type ADD VALUE 'paciente';
    END IF;
    
    -- Add 'simples' to occurrence_type
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'occurrence_type' AND e.enumlabel = 'simples') THEN
        ALTER TYPE occurrence_type ADD VALUE 'simples';
    END IF;
END$$;
