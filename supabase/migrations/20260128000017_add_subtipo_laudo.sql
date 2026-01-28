ALTER TABLE public.ocorrencia_laudo ADD COLUMN IF NOT EXISTS subtipo TEXT DEFAULT 'revisao_exame';

-- Update existing records
UPDATE public.ocorrencia_laudo SET subtipo = 'revisao_exame' WHERE subtipo IS NULL;
