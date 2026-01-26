
-- 1. Upgrade maintenance_records view to include resolution data
DROP VIEW IF EXISTS public.operacional_chamados_view;
DROP VIEW IF EXISTS public.maintenance_records;

CREATE OR REPLACE VIEW public.maintenance_records AS
SELECT 
    id, 
    criado_em as created_at, 
    'ar_condicionado'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    null::text as finalizado_por -- Placeholder if we don't have join ready, or use resolvido_por UUID
FROM public.chamados_ar_condicionado
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'banheiro'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    problema as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    null::text as finalizado_por
FROM public.chamados_banheiro
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'dispenser'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    observacao as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    null::text as finalizado_por
FROM public.chamados_dispenser;

-- 2. Create the View expected by Dashboards
CREATE OR REPLACE VIEW public.operacional_chamados_view AS
SELECT
    id,
    created_at as data_abertura,
    tipo_origem as tipo_chamado,
    status,
    localizacao,
    protocolo,
    descricao as problema,
    descricao as descricao_detalhada,
    resolvido_em as data_fechamento,
    -- Calculate generic duration
    EXTRACT(EPOCH FROM (COALESCE(resolvido_em, NOW()) - created_at))/3600 as tempo_resolucao_horas,
    tenant_id,
    finalizado_por,
    null::text as observacoes_fechamento
FROM public.maintenance_records;

-- 3. Grant Permissions
GRANT SELECT ON public.maintenance_records TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.operacional_chamados_view TO postgres, anon, authenticated, service_role;

-- 4. ENSURE ocorrencias_adm exists (Redundant check)
CREATE TABLE IF NOT EXISTS public.ocorrencias_adm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id),
    criado_por UUID REFERENCES public.profiles(id),
    titulo TEXT,
    descricao TEXT,
    categoria TEXT,
    prioridade TEXT,
    status TEXT DEFAULT 'pendente',
    protocolo TEXT
);
GRANT ALL ON public.ocorrencias_adm TO postgres, anon, authenticated, service_role;

-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
