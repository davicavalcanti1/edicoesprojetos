
-- 1. Tabela de Sequência para Protocolos Diários
CREATE TABLE IF NOT EXISTS protocol_sequences (
    date_key DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    current_val INTEGER DEFAULT 0
);

-- 2. Função para Gerar Protocolo Único (YYYYMMDD-XXXXXX)
CREATE OR REPLACE FUNCTION generate_daily_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    seq_val INTEGER;
    formatted_date TEXT;
BEGIN
    -- Formata data YYYYMMDD
    formatted_date := to_char(today, 'YYYYMMDD');
    
    -- Insere ou Atualiza a sequência de forma atômica
    INSERT INTO protocol_sequences (date_key, current_val)
    VALUES (today, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET current_val = protocol_sequences.current_val + 1
    RETURNING current_val INTO seq_val;
    
    -- Retorna formatado: 20240125-000001
    RETURN formatted_date || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$;

-- 3. Tabela de Manutenções (Unificada para Ar-Condicionado e Terceirizados)
-- Justificativa: Facilita queries de custos globais e histórico por local, evitando joins complexos.
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Campos de Classificação
    tipo_origem TEXT NOT NULL, -- 'ar_condicionado', 'banheiro_ralo', etc
    subtipo TEXT, -- 'imago', 'terceirizado', 'dreno', 'limpeza_ralo'
    
    -- Identificação Local/Equipamento
    localizacao TEXT,
    sala TEXT,
    numero_serie TEXT,
    modelo TEXT,
    
    -- Execução
    responsavel TEXT NOT NULL, -- Nome do funcionário/técnico
    empresa TEXT, -- Se terceirizado
    data_manutencao DATE NOT NULL,
    
    -- Detalhes
    descricao TEXT,
    tipo_manutencao TEXT, -- 'preventiva', 'corretiva', etc
    observacoes TEXT,
    
    -- Ar Condicionado Específicos
    tem_defeito BOOLEAN DEFAULT FALSE,
    defeito_descricao TEXT,
    
    -- Financeiro
    custo NUMERIC(10,2),
    proxima_manutencao DATE,
    
    -- Mídia (URLs das fotos no Storage)
    fotos JSONB DEFAULT '[]'::JSONB 
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(data_manutencao);
CREATE INDEX IF NOT EXISTS idx_maintenance_serial ON maintenance_records(numero_serie);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_records(tipo_origem);

-- 4. Ajustes na tabela occurrences (Tickets/Chamados) se necessário
-- Garantir que temos colunas para o fluxo de finalização
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMPTZ;
-- Protocolo já deve existir, se não:
-- ALTER TABLE occurrences ADD COLUMN IF NOT EXISTS protocolo TEXT UNIQUE;

-- Create policy examples (adjust according to your RLS needs)
-- ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read/write for all" ON maintenance_records FOR ALL USING (true);
