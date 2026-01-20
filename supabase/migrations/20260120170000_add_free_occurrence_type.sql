-- Add 'livre' to occurrence_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid  
                   WHERE t.typname = 'occurrence_type' AND e.enumlabel = 'livre') THEN
        ALTER TYPE occurrence_type ADD VALUE 'livre';
    END IF;
END$$;

-- Add columns for free text occurrences
ALTER TABLE public.occurrences 
ADD COLUMN IF NOT EXISTS custom_type TEXT,
ADD COLUMN IF NOT EXISTS related_employee_id UUID REFERENCES public.profiles(id);

-- Update RLS if needed?
-- The existing policies usually cover INSERT for authenticated users and SELECT for filtered rows.
-- We rely on existing policies for now.
