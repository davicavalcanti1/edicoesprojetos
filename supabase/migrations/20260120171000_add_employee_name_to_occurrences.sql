-- Add employee_name column to occurrences table to support text-based employee selection
ALTER TABLE public.occurrences ADD COLUMN IF NOT EXISTS employee_name TEXT;
