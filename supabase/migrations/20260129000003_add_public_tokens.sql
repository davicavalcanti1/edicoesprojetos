-- Add public_token to all occurrence tables for PDF/QR Access
-- This token allows public access to specific occurrence views (like the PDF or image gallery)

-- Administrative
ALTER TABLE public.ocorrencia_adm
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Nursing (Enfermagem)
ALTER TABLE public.ocorrencia_enf
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Medical Review (Laudo) - might already exist, but ensuring
ALTER TABLE public.ocorrencia_laudo
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Patient (Paciente)
ALTER TABLE public.ocorrencia_paciente
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Free/Generic (Livre)
ALTER TABLE public.ocorrencia_livre
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_adm_token ON public.ocorrencia_adm(public_token);
CREATE INDEX IF NOT EXISTS idx_enf_token ON public.ocorrencia_enf(public_token);
CREATE INDEX IF NOT EXISTS idx_laudo_token ON public.ocorrencia_laudo(public_token);
CREATE INDEX IF NOT EXISTS idx_paciente_token ON public.ocorrencia_paciente(public_token);
CREATE INDEX IF NOT EXISTS idx_livre_token ON public.ocorrencia_livre(public_token);
