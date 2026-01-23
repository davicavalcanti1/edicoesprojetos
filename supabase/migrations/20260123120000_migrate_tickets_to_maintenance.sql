-- 1. Adjust maintenance_records to support Ticket Workflow
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberto'; -- 'aberto', 'em_andamento', 'concluida'
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id);
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMPTZ;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS finalizado_por TEXT; -- Or UUID

-- Create Check Constrain for Status if needed, but text is fine for now or create enum
-- ALTER TABLE maintenance_records ADD CONSTRAINT chk_status CHECK (status IN ('aberto', 'em_andamento', 'concluida', 'cancelado'));

-- Make some fields nullable since they are not known at opening time
ALTER TABLE maintenance_records ALTER COLUMN data_manutencao DROP NOT NULL;
ALTER TABLE maintenance_records ALTER COLUMN responsavel DROP NOT NULL;

-- 2. Update the View to pull from maintenance_records for Operational Tickets
-- We drop the old view which pulled from occurrences
DROP VIEW IF EXISTS operacional_chamados_view;

CREATE OR REPLACE VIEW operacional_chamados_view AS
SELECT
    m.id,
    m.protocolo,
    m.created_at as data_abertura,
    m.finalizado_em as data_fechamento,
    m.status,
    -- Map maintenance columns to view columns
    m.tipo_origem as tipo_chamado, -- 'ar_condicionado', etc
    coalesce(m.localizacao, m.sala, 'Não informado') as localizacao,
    -- Problem description
    coalesce(m.descricao, m.defeito_descricao, 'Sem descrição') as problema,
    m.descricao as descricao_detalhada, -- Use description as detailed description
    m.observacoes as observacoes_fechamento,
    m.finalizado_por,
    -- Calc time
    case 
        when m.finalizado_em is not null then 
            round(cast(extract(epoch from (m.finalizado_em - m.created_at))/3600 as numeric), 2)
        else null
    end as tempo_resolucao_horas
FROM maintenance_records m;

-- Grant permissions
GRANT SELECT ON operacional_chamados_view TO authenticated;
GRANT ALL ON maintenance_records TO authenticated;
