-- PART 3: NURSING OCCURRENCES ADDON

-- 1. Create Ocorrencia Enfermagem Table
CREATE TABLE public.ocorrencia_enf (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: ENF-YYYYMMDD-SEQUENCE
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Snapshot Paciente (Required for Enfermagem)
    paciente_nome TEXT NOT NULL,
    paciente_cpf TEXT,
    paciente_data_nascimento DATE,
    paciente_telefone TEXT,
    paciente_tipo_exame TEXT,
    paciente_unidade_local TEXT,
    paciente_data_hora_evento TEXT, -- Keeping as text/timestamp to match input

    -- Details
    tipo TEXT NOT NULL DEFAULT 'enfermagem',
    subtipo TEXT NOT NULL, -- 'extravasamento_enfermagem' OR 'reacoes_adversas'
    
    medico_avaliou TEXT,
    conduta TEXT,

    -- Specific Fields (Flattened)
    volume_injetado_ml TEXT, -- For Extravasamento & Reacoes (Quantity)
    calibre_acesso TEXT,
    fez_rx BOOLEAN,
    teve_compressa BOOLEAN,
    
    contraste_utilizado TEXT,
    validade_lote TEXT,
    
    -- Responsáveis (Extravasamento)
    responsavel_auxiliar_enf TEXT,
    responsavel_tecnico_raio_x TEXT,
    responsavel_coordenador TEXT,
    
    -- Workflow
    status TEXT NOT NULL DEFAULT 'registrada' CHECK (
        status IN ('registrada', 'analise_tecnica', 'concluida', 'improcedente')
    ),

    dados_adicionais JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.ocorrencia_enf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read enf" ON public.ocorrencia_enf FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert enf" ON public.ocorrencia_enf FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update enf" ON public.ocorrencia_enf FOR UPDATE TO authenticated USING (true);


-- 2. Modify Attachments to support Enf
ALTER TABLE public.attachments ADD COLUMN ocorrencia_enf_id UUID REFERENCES public.ocorrencia_enf(id) ON DELETE CASCADE;

-- Update constraint to ensure attachment belongs to only one type (Laudo OR Adm OR Enf)
-- First drop existing constraint
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS check_origin;

-- Add new constraint
ALTER TABLE public.attachments ADD CONSTRAINT check_origin CHECK (
    (ocorrencia_laudo_id IS NOT NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NOT NULL AND ocorrencia_enf_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NOT NULL)
);


-- 3. Protocol Generator (Enf)
CREATE OR REPLACE FUNCTION public.generate_protocol_enf()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.ocorrencia_enf
    WHERE substring(protocolo from 5 for 8) = date_part;
    NEW.protocolo := 'ENF-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_enf BEFORE INSERT ON public.ocorrencia_enf
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_enf();
