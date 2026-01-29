-- Add signature columns to Administrative Occurrences
ALTER TABLE public.ocorrencia_adm
ADD COLUMN IF NOT EXISTS assinatura_responsavel_url TEXT,
ADD COLUMN IF NOT EXISTS assinatura_colaborador_url TEXT;

-- Add PDF storage columns to ALL occurrence tables
-- Administrative
ALTER TABLE public.ocorrencia_adm
ADD COLUMN IF NOT EXISTS pdf_conclusao_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;

-- Nursing (Enfermagem)
ALTER TABLE public.ocorrencia_enf
ADD COLUMN IF NOT EXISTS pdf_conclusao_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;

-- Medical Review (Laudo)
ALTER TABLE public.ocorrencia_laudo
ADD COLUMN IF NOT EXISTS pdf_conclusao_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;

-- Patient (Paciente)
ALTER TABLE public.ocorrencia_paciente
ADD COLUMN IF NOT EXISTS pdf_conclusao_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;

-- Free/Generic (Livre)
ALTER TABLE public.ocorrencia_livre
ADD COLUMN IF NOT EXISTS pdf_conclusao_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_gerado_em TIMESTAMP WITH TIME ZONE;
