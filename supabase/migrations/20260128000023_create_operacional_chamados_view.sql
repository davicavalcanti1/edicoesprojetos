-- Add missing finalization fields to Ar Condicionado
ALTER TABLE public.chamados_ar_condicionado
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

-- Drop view if exists to rebuild definition
DROP VIEW IF EXISTS public.operacional_chamados_view;

-- Create Unified View for Operational Dashboard/Reports
CREATE OR REPLACE VIEW public.operacional_chamados_view AS
SELECT 
    id,
    protocolo,
    'dispenser' as tipo_chamado,
    localizacao,
    problema,
    observacao as descricao_detalhada,
    status,
    criado_em as data_abertura,
    resolvido_em as data_fechamento,
    finalizado_por,
    ROUND((EXTRACT(EPOCH FROM (resolvido_em - criado_em))/3600)::numeric, 2) as tempo_resolucao_horas,
    tenant_id
FROM public.chamados_dispenser

UNION ALL

SELECT 
    id,
    protocolo,
    'banheiro' as tipo_chamado,
    localizacao,
    problema,
    observacao as descricao_detalhada,
    status,
    criado_em as data_abertura,
    resolvido_em as data_fechamento,
    finalizado_por,
    ROUND((EXTRACT(EPOCH FROM (resolvido_em - criado_em))/3600)::numeric, 2) as tempo_resolucao_horas,
    tenant_id
FROM public.chamados_banheiro

UNION ALL

SELECT 
    id,
    protocolo,
    'ar_condicionado' as tipo_chamado,
    localizacao,
    tipo_solicitacao as problema,
    descricao as descricao_detalhada,
    status,
    criado_em as data_abertura,
    resolvido_em as data_fechamento,
    finalizado_por,
    ROUND((EXTRACT(EPOCH FROM (resolvido_em - criado_em))/3600)::numeric, 2) as tempo_resolucao_horas,
    tenant_id
FROM public.chamados_ar_condicionado;

-- Grant access
GRANT SELECT ON public.operacional_chamados_view TO authenticated;
GRANT SELECT ON public.operacional_chamados_view TO anon;
