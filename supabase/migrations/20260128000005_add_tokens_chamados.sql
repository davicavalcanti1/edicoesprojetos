-- Migration to add public_token to existing Chamados tables
-- Run this if you already created the tables without the public_token column

DO $$
BEGIN
    -- Dispenser
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chamados_dispenser' AND column_name = 'public_token') THEN
        ALTER TABLE public.chamados_dispenser ADD COLUMN public_token TEXT UNIQUE;
    END IF;

    -- Banheiro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chamados_banheiro' AND column_name = 'public_token') THEN
        ALTER TABLE public.chamados_banheiro ADD COLUMN public_token TEXT UNIQUE;
    END IF;

    -- Ar Condicionado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chamados_ar_condicionado' AND column_name = 'public_token') THEN
        ALTER TABLE public.chamados_ar_condicionado ADD COLUMN public_token TEXT UNIQUE;
    END IF;
END $$;
