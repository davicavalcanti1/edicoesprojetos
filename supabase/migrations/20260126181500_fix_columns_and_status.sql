/*
Fix specific columns and status type to prevent 400 errors during updates.
Handles dependencies by dropping views first.
*/

-- 1. Drop dependent views first
DROP VIEW IF EXISTS public.operacional_chamados_view;
DROP VIEW IF EXISTS public.maintenance_records;

-- 2. Dispenser
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;
ALTER TABLE public.chamados_dispenser ALTER COLUMN status TYPE text;
ALTER TABLE public.chamados_dispenser ALTER COLUMN status SET DEFAULT 'aberto';

-- 3. Banheiro
ALTER TABLE public.chamados_banheiro ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_banheiro ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;
ALTER TABLE public.chamados_banheiro ALTER COLUMN status TYPE text;
ALTER TABLE public.chamados_banheiro ALTER COLUMN status SET DEFAULT 'aberto';

-- 4. Ar Condicionado
ALTER TABLE public.chamados_ar_condicionado ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_ar_condicionado ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;
ALTER TABLE public.chamados_ar_condicionado ALTER COLUMN status TYPE text;
ALTER TABLE public.chamados_ar_condicionado ALTER COLUMN status SET DEFAULT 'aberto';

-- 5. Recreate Views 
-- (This definition must match your desired view structure from previous steps)
CREATE OR REPLACE VIEW public.maintenance_records AS
SELECT 
    id, 
    criado_em as created_at, 
    'ar_condicionado'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    'Manutenção AC'::text as categoria_problema, 
    descricao as descricao_texto, 
    status, -- already text now
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_ar_condicionado
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'banheiro'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    problema as categoria_problema, 
    observacao as descricao_texto, 
    status,
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_banheiro
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'dispenser'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    problema as categoria_problema, 
    observacao as descricao_texto, 
    status,
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_dispenser;

CREATE OR REPLACE VIEW public.operacional_chamados_view AS
SELECT
    id,
    created_at as data_abertura,
    tipo_origem as tipo_chamado,
    status,
    localizacao,
    protocolo,
    categoria_problema as problema,
    descricao_texto as descricao_detalhada,
    resolvido_em as data_fechamento,
    EXTRACT(EPOCH FROM (COALESCE(resolvido_em, NOW()) - created_at))/3600 as tempo_resolucao_horas,
    tenant_id,
    finalizado_por,
    null::text as observacoes_fechamento
FROM public.maintenance_records;

-- 6. Grant Permissions
GRANT SELECT ON public.maintenance_records TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.operacional_chamados_view TO postgres, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON public.chamados_dispenser TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.chamados_banheiro TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.chamados_ar_condicionado TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload config';
