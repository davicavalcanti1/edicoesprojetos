-- 1. Ensure occurrences table has the necessary columns for Assistencial/WhatsApp flow
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS paciente_nome TEXT;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS paciente_id TEXT;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMPTZ;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

-- 2. Drop the existing view to allow column type changes (fixing ERROR: 42P16)
DROP VIEW IF EXISTS operacional_chamados_view;

-- 3. Update the View to include both Maintenance Records and Assistencial Occurrences
CREATE OR REPLACE VIEW operacional_chamados_view AS
SELECT
    m.id::text as id,
    m.protocolo,
    m.created_at as data_abertura,
    m.finalizado_em as data_fechamento,
    m.status::text as status,
    m.tipo_origem::text as tipo_chamado, -- 'ar_condicionado', etc
    coalesce(m.localizacao, m.sala, 'Não informado') as localizacao,
    coalesce(m.descricao, m.defeito_descricao, 'Sem descrição') as problema,
    m.descricao as descricao_detalhada,
    m.observacoes as observacoes_fechamento,
    m.finalizado_por,
    case 
        when m.finalizado_em is not null then 
            round(cast(extract(epoch from (m.finalizado_em - m.created_at))/3600 as numeric), 2)
        else null
    end as tempo_resolucao_horas
FROM maintenance_records m
UNION ALL
SELECT
    o.id::text as id,
    o.protocolo,
    o.criado_em as data_abertura,
    o.finalizado_em as data_fechamento,
    o.status::text as status,
    -- Cast enums to text to allow coalescing different types
    coalesce(o.subtipo::text, o.tipo::text) as tipo_chamado,
    -- Map Patient Name to location for Assistencial tickets so it appears in the table
    coalesce(o.paciente_nome, 'Não informado') as localizacao,
    o.descricao_detalhada as problema,
    o.descricao_detalhada,
    o.observacoes as observacoes_fechamento,
    -- Cast UUID to text if necessary, assuming columns match type or cast them
    o.finalizado_por::text as finalizado_por, 
    case 
        when o.finalizado_em is not null then 
            round(cast(extract(epoch from (o.finalizado_em - o.criado_em))/3600 as numeric), 2)
        else null
    end as tempo_resolucao_horas
FROM occurrences o
-- Exclude maintenance types from occurrences if they are already in maintenance_records to avoid duplicates
WHERE o.tipo::text != 'manutencao';

GRANT SELECT ON operacional_chamados_view TO authenticated;
GRANT SELECT ON operacional_chamados_view TO anon; -- If public access needed for dashboard
