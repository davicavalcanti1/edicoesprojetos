ALTER TABLE public.ocorrencia_laudo ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'revisao_exame';

-- Update existing records
UPDATE public.ocorrencia_laudo SET tipo = 'revisao_exame' WHERE tipo IS NULL;
