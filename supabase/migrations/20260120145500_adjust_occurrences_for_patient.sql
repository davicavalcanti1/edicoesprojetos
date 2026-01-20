-- Allow null for created_por (for anonymous/patient entries)
ALTER TABLE public.occurrences ALTER COLUMN criado_por DROP NOT NULL;

-- Allow null for subtipo (patient type might not have one)
ALTER TABLE public.occurrences ALTER COLUMN subtipo DROP NOT NULL;
