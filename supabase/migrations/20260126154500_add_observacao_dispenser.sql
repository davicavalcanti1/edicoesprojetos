-- Add observacao column to chamados_dispenser if it doesn't exist
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS observacao text;
