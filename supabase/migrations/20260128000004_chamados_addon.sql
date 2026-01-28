-- PART 4: QR CODE REQUESTS (CHAMADOS) ADDON

-- 1. Create Chamados Dispenser Table
CREATE TABLE public.chamados_dispenser (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: DISP-YYYYMMDD-SEQUENCE
    localizacao TEXT,
    marca TEXT,
    tipo_insumo TEXT,
    problema TEXT,
    observacao TEXT,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    status TEXT DEFAULT 'aberto',
    public_token TEXT UNIQUE, -- Added for secure public link finalization
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ... (Policies remain same)

-- 2. Create Chamados Banheiro Table
CREATE TABLE public.chamados_banheiro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: BAN-YYYYMMDD-SEQUENCE
    localizacao TEXT,
    problema TEXT,
    observacao TEXT,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    status TEXT DEFAULT 'aberto',
    public_token TEXT UNIQUE, -- Added for secure public link finalization
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ... (Policies remain same)

-- 3. Create Chamados Ar Condicionado Table
CREATE TABLE public.chamados_ar_condicionado (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: AR-YYYYMMDD-SEQUENCE
    localizacao TEXT, -- Sala
    modelo TEXT,
    numero_serie TEXT,
    tipo_solicitacao TEXT,
    descricao TEXT,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    status TEXT DEFAULT 'aberto',
    public_token TEXT UNIQUE, -- Added for secure public link finalization
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chamados_ar_condicionado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert ar_condicionado" ON public.chamados_ar_condicionado FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated insert ar_condicionado" ON public.chamados_ar_condicionado FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public read ar_condicionado" ON public.chamados_ar_condicionado FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read ar_condicionado" ON public.chamados_ar_condicionado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated update ar_condicionado" ON public.chamados_ar_condicionado FOR UPDATE TO authenticated USING (true);


-- 4. Modify Attachments to support Chamados & Tags
ALTER TABLE public.attachments ADD COLUMN chamado_dispenser_id UUID REFERENCES public.chamados_dispenser(id) ON DELETE CASCADE;
ALTER TABLE public.attachments ADD COLUMN chamado_banheiro_id UUID REFERENCES public.chamados_banheiro(id) ON DELETE CASCADE;
ALTER TABLE public.attachments ADD COLUMN chamado_ar_condicionado_id UUID REFERENCES public.chamados_ar_condicionado(id) ON DELETE CASCADE;

ALTER TABLE public.attachments ADD COLUMN tag TEXT; -- 'antes', 'depois', 'evidencia', etc.

-- Update constraint to ensure attachment belongs to only one type (Laudo, Adm, Enf, Dispenser, Banheiro, Ar)
-- First drop existing constraint (from enf migration)
ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS check_origin;

-- Add new exhaustive constraint
ALTER TABLE public.attachments ADD CONSTRAINT check_origin CHECK (
    (ocorrencia_laudo_id IS NOT NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NOT NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NOT NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NOT NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NOT NULL AND chamado_ar_condicionado_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NULL AND ocorrencia_enf_id IS NULL AND chamado_dispenser_id IS NULL AND chamado_banheiro_id IS NULL AND chamado_ar_condicionado_id IS NOT NULL)
);

-- Update RLS for attachments to allow public access if linked to chamados (since chamados themselves are public viewable in this context)
DROP POLICY IF EXISTS "Public read attachments" ON public.attachments; 
DROP POLICY IF EXISTS "Public read attachments via token join" ON public.attachments; 
DROP POLICY IF EXISTS "Public read attachments via token" ON public.attachments; 

CREATE POLICY "Public read attachments" ON public.attachments FOR SELECT TO anon 
USING (
    -- Access if linked to a Chamado (Publicly viewable)
    chamado_dispenser_id IS NOT NULL OR 
    chamado_banheiro_id IS NOT NULL OR 
    chamado_ar_condicionado_id IS NOT NULL OR
    -- OR if linked to Ocorrencia with public_token
    EXISTS (SELECT 1 FROM public.ocorrencia_laudo WHERE id = attachments.ocorrencia_laudo_id AND public_token IS NOT NULL)
);

-- Allow public upload if linked to chamados (necessary for anon form submission)
CREATE POLICY "Public upload attachments" ON public.attachments FOR INSERT TO anon 
WITH CHECK (
    chamado_dispenser_id IS NOT NULL OR 
    chamado_banheiro_id IS NOT NULL OR 
    chamado_ar_condicionado_id IS NOT NULL
);


-- 5. Protocol Generators
-- Dispenser
CREATE OR REPLACE FUNCTION public.generate_protocol_disp()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 14) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.chamados_dispenser
    WHERE substring(protocolo from 6 for 8) = date_part;
    NEW.protocolo := 'DISP-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_disp BEFORE INSERT ON public.chamados_dispenser
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_disp();

-- Banheiro
CREATE OR REPLACE FUNCTION public.generate_protocol_ban()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.chamados_banheiro
    WHERE substring(protocolo from 5 for 8) = date_part;
    NEW.protocolo := 'BAN-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_ban BEFORE INSERT ON public.chamados_banheiro
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_ban();

-- Ar Condicionado
CREATE OR REPLACE FUNCTION public.generate_protocol_ar()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 12) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.chamados_ar_condicionado
    WHERE substring(protocolo from 4 for 8) = date_part;
    NEW.protocolo := 'AR-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_ar BEFORE INSERT ON public.chamados_ar_condicionado
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_ar();
