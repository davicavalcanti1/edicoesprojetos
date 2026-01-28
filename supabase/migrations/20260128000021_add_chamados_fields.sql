
-- Migration to add missing fields to Chamados tables

-- 1. Ar Condicionado
ALTER TABLE public.chamados_ar_condicionado 
ADD COLUMN IF NOT EXISTS dados_adicionais JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS solicitante_info JSONB DEFAULT '{}'::jsonb; -- Keeping this specifically if code relies on it, but dados_adicionais is preferred standard.

-- 2. Dispenser (Consistency)
ALTER TABLE public.chamados_dispenser
ADD COLUMN IF NOT EXISTS dados_adicionais JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';

-- 3. Banheiro (Consistency)
ALTER TABLE public.chamados_banheiro
ADD COLUMN IF NOT EXISTS dados_adicionais JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';
