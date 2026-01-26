/* 
Redefine maintenance_records to correctly map 'problema' and 'observacao' from sub-tables.
This ensures 'descricao_detalhada' in the final view contains the user's free text input,
and 'problema' contains the category classifier.
*/

DROP VIEW IF EXISTS public.operacional_chamados_view;
DROP VIEW IF EXISTS public.maintenance_records;

CREATE OR REPLACE VIEW public.maintenance_records AS
SELECT 
    id, 
    criado_em as created_at, 
    'ar_condicionado'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    'Manutenção AC'::text as categoria_problema, 
    descricao as descricao_texto, 
    status::text, 
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
    status::text, 
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
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_dispenser;

/* Recreate the Operational View with corrected mappings */
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

GRANT SELECT ON public.maintenance_records TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.operacional_chamados_view TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload config';
