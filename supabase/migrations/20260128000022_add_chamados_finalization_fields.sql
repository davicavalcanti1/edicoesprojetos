-- Migration to add finalization fields to Dispenser and Banheiro tables

-- 1. Dispenser
ALTER TABLE public.chamados_dispenser
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

-- 2. Banheiro
ALTER TABLE public.chamados_banheiro
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
