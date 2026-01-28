-- PART 5: PATIENT AND FREE OCCURRENCES ADDON

-- 1. Create Ocorrencia Paciente Table
CREATE TABLE public.ocorrencia_paciente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: PAC-YYYYMMDD-SEQUENCE
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Snapshot Paciente
    paciente_nome TEXT NOT NULL,
    paciente_cpf TEXT,
    paciente_data_nascimento DATE,
    paciente_telefone TEXT,
    paciente_email TEXT, -- Contact might be useful for patient feedback

    -- Details
    tipo TEXT NOT NULL DEFAULT 'paciente',
    subtipo TEXT, -- 'elogio', 'reclamacao', 'sugestao'
    relato_paciente TEXT, 
    area_envolvida TEXT,
    classificacao TEXT, -- 'atendimento', 'instalacoes', etc.
    
    -- Workflow
    status TEXT NOT NULL DEFAULT 'registrada',
    
    dados_adicionais JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.ocorrencia_paciente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read pac" ON public.ocorrencia_paciente FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert pac" ON public.ocorrencia_paciente FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update pac" ON public.ocorrencia_paciente FOR UPDATE TO authenticated USING (true);


-- 2. Create Ocorrencia Livre Table (Generic)
CREATE TABLE public.ocorrencia_livre (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: GEN-YYYYMMDD-SEQUENCE
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Snapshot Paciente (Optional but common)
    paciente_nome TEXT,
    paciente_cpf TEXT,
    paciente_data_nascimento DATE,
    paciente_telefone TEXT,

    -- Details
    tipo TEXT NOT NULL DEFAULT 'livre',
    subtipo TEXT, 
    titulo TEXT,
    descricao TEXT,
    
    -- Workflow
    status TEXT NOT NULL DEFAULT 'registrada',
    
    dados_adicionais JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.ocorrencia_livre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read livre" ON public.ocorrencia_livre FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert livre" ON public.ocorrencia_livre FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update livre" ON public.ocorrencia_livre FOR UPDATE TO authenticated USING (true);


-- 3. Modify Attachments to support these new tables
ALTER TABLE public.attachments ADD COLUMN ocorrencia_paciente_id UUID REFERENCES public.ocorrencia_paciente(id) ON DELETE CASCADE;
ALTER TABLE public.attachments ADD COLUMN ocorrencia_livre_id UUID REFERENCES public.ocorrencia_livre(id) ON DELETE CASCADE;

-- Update constraint (Exhaustive check)
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS check_origin;

ALTER TABLE public.attachments ADD CONSTRAINT check_origin CHECK (
    (ocorrencia_laudo_id IS NOT NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NOT NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NOT NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NOT NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NOT NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NOT NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NOT NULL AND ocorrencia_livre_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL AND ocorrencia_paciente_id IS NULL AND ocorrencia_livre_id IS NOT NULL)
);


-- 4. Protocol Generators
-- Paciente
CREATE OR REPLACE FUNCTION public.generate_protocol_pac()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.ocorrencia_paciente
    WHERE substring(protocolo from 5 for 8) = date_part;
    NEW.protocolo := 'PAC-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_pac BEFORE INSERT ON public.ocorrencia_paciente
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_pac();

-- Livre (Generic)
CREATE OR REPLACE FUNCTION public.generate_protocol_livre()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.ocorrencia_livre
    WHERE substring(protocolo from 5 for 8) = date_part;
    NEW.protocolo := 'GEN-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_livre BEFORE INSERT ON public.ocorrencia_livre
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_livre();
