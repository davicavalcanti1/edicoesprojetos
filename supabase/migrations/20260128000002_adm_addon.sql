-- PART 2: ADMIN OCCURRENCES ADDON

-- 1. Create Employees Table (Funcionarios)
CREATE TABLE public.funcionarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT,
    setor TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read funcionarios" ON public.funcionarios FOR SELECT USING (true);
CREATE POLICY "Admin write funcionarios" ON public.funcionarios FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.funcionarios (nome) VALUES 
 ('ABRAHÃO JÚNIOR DE ALMEIDA'),
 ('ALICE MATIAS PEREIRA DA SILVA'),
 ('ALINE JULIANA PEREIRA DA SILVA'),
 ('ALINE PATRICIA MARTINS DA SILVA CASTRO'),
 ('ALISSON RAFAEL NUNES DA SILVA'),
 ('ALYCE VITORIA CAMPOS VIDAL'),
 ('AMANDA DE ARAUJO FLORENTINO'),
 ('ANA CAROLINA LISBOA BEZERRA'),
 ('ANA CAROLINA SILVA DE SOUZA'),
 ('ANA CLAUDIA FERNANDES PERES'),
 ('ANA CRISTINA JORDAO DE AQUINO'),
 ('ANA PAULA GOMES BARBOSA'),
 ('ANDREZA PEREIRA DA SILVA'),
 ('ANTONIO PEDRO DOS SANTOS DE ARAUJO'),
 ('BEATRIZ ARAUJO HONORIO'),
 ('BRUNA MORAIS DE BRITO'),
 ('BRUNO DOS SANTOS SOARES'),
 ('CAIO HENRIQUE RAMOS MEDEIROS'),
 ('CAIO LUCAS DE MEDEIROS GUIMARAES'),
 ('CAMILA PAULINO DE SOUSA SILVA'),
 ('CLAUDIA COSTA DO NASCIMENTO'),
 ('CRISTIANO FLORIANO DE OLIVEIRA'),
 ('DANIELA DE LIMA FERREIRA'),
 ('DANIELA NATALIA DA SILVA SOBRAL'),
 ('DAYANE AGUIAR DA SILVA'),
 ('DIEGO NILSON CAVALCANTE ALMEIDA'),
 ('ELLEN BEATRIZ SAMPAIO SILVA'),
 ('ELLEN MENDES DE FREITAS'),
 ('EMANUELA VIEIRA RAPOSO DE ARAUJO'),
 ('ERICA MAYARA DE SOUSA CORDEIRO'),
 ('ERILA KLECIA FERREIRA DA SILVA'),
 ('GABRIELA DE MELO ALVES'),
 ('GESSICA DE SOUZA COSTA MAIA GADELHA'),
 ('GISELI FERREIRA DIAS'),
 ('GISLAYNE ROCHA RODRIGUES'),
 ('HILMA VIRGINIA VASCONCELOS LOUREIRO'),
 ('IAN DO NASCIMENTO BARBOSA'),
 ('IANE SOUZA QUEIROZ DE PONTES'),
 ('ITAINARA PINTO DA SILVA'),
 ('IVSON GUSTAVO GOMES DE OLIVEIRA'),
 ('IZABELA LORENA RIBEIRO DA SILVA'),
 ('JOANITA DE ALCANTARA BESERRA ALVES'),
 ('JOAO PAULO AGUIAR DE BRITTO LYRA'),
 ('JOAO VICTOR FERNANDES DE SOUZA'),
 ('JOSE MOTA DA SILVA'),
 ('JOSÉ FELIPE LISBÔA FRANÇA'),
 ('JUAN PABLO FARIAS LIMA'),
 ('JULIA SOUSA SILVA'),
 ('KALYNE PEREIRA DOS SANTOS'),
 ('KELVESON WENDELL TRAJANO RIBEIRO'),
 ('KESSIA KAROLINE FLORO LEMOS'),
 ('KLEMONICA SILVA COSTA'),
 ('LARA OHARRANA CELESTINO SILVA'),
 ('LARYSSA RAVENA NOBREGA BARROS XAVIER'),
 ('LAURA DOS SANTOS FERREIRA'),
 ('LIDIANE DA SILVA PATRICIO'),
 ('LIDIANE MARIA CAVALCANTI'),
 ('LILLIAN VIANA DA COSTA'),
 ('LORRAYNE MENDES VELOZO'),
 ('LUAN DE FARIAS QUEIROZ'),
 ('LUANA SOUZA DOS SANTOS'),
 ('LUIS FELIPE MEDEIROS HALULE'),
 ('LUIZ GABRIEL TAVARES'),
 ('MAERCIA DA SILVA AZEVEDO LIMA'),
 ('MAIRA ANDRADE DA ROCHA'),
 ('MARIA APARECIDA DOS SANTOS'),
 ('MARIA BEATRIZ SILVA DE OLIVEIRA'),
 ('MARIA DAS GRACAS DOS SANTOS LOURENCO'),
 ('MARIA LUCIA DE AGUIAR'),
 ('MARIA SAMYRA AGRICIO ATAIDE SOUZA'),
 ('MARIANA IZABEL DA SILVA FRANCELINO'),
 ('MARY ROSE VIEIRA CHAVES'),
 ('MELISSA ALMEIDA MELO'),
 ('MOISES COSTA MACHADO'),
 ('MONALY TAIZZE DE SOUZA'),
 ('MONICA SOLANGE BARRETO DE MELO'),
 ('NATHAN OLIVEIRA DE CARVALHO'),
 ('NAYALA GOMES DE LACERDA'),
 ('NHAYARA LARISSA DE ALMEIDA MARINHO'),
 ('PALOMA PRICILA MARQUES DOS SANTOS'),
 ('PAMELA HELOISY LUCENA DE SOUZA'),
 ('PAULA FABRICIA DO NASCIMENTO ARAUJO'),
 ('PEDRO HENRIQUE GARCIA LIRA'),
 ('POLIANA GALBA CLAUDINO SILVA'),
 ('PRISCILA ALMEIDA'),
 ('PRISCILA NUNES MOREIRA MARCELINO'),
 ('RAFAEL GUIMARAES COSTA'),
 ('RAFAEL PEREIRA DA COSTA SILVA'),
 ('RANIELE RODRIGUES DA COSTA'),
 ('RAYSSA MORAES MARTINS'),
 ('RENE ARAUJO PEREIRA MENDOÇA DE LUCENA'),
 ('RODRIGO HENRIQUE ALVES DE LIMA'),
 ('SAMARA RODRIGUES FERREIRA'),
 ('SARAH MARIA CARVALHO LOPES'),
 ('SERGIO PEREIRA SOBREIRA'),
 ('SINDIA MARA PEREIRA DA SILVA RODRIGUES'),
 ('STEFANNY BESERRA NUNES'),
 ('STELLA SOUTO SILVA'),
 ('THAIS LORENA DA SILVA SANTOS'),
 ('THALIA PEREIRA RODRIGUES'),
 ('THALITA RANIELLY MORAES RAMOS'),
 ('URIEL BARBOSA QUEIROGA SOUSA'),
 ('VANESSA DA SILVA OLIVEIRA'),
 ('VANESSA RIBEIRO DA FRANCA'),
 ('VINICIUS YEGO MEDEIROS MACEDO'),
 ('YASMIN MARIA DE FARIAS DAMASIO');


-- 2. Create Ocorrencia Adm Table
CREATE TABLE public.ocorrencia_adm (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL, -- Format: ADM-YYYYMMDD-SEQUENCE
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Snapshot Paciente (Less strict than Laudo)
    paciente_nome TEXT,
    paciente_cpf TEXT,
    paciente_data_nascimento DATE,
    paciente_telefone TEXT,

    -- Details
    tipo TEXT NOT NULL DEFAULT 'administrativa',
    subtipo TEXT, 
    titulo TEXT,
    descricao_detalhada TEXT,
    prioridade TEXT DEFAULT 'media',
    atribuido_a UUID REFERENCES public.profiles(id), 

    -- Signatures (URLs)
    assinatura_responsavel_url TEXT,
    assinatura_testemunha_url TEXT,
    assinatura_envolvido_url TEXT,

    -- Workflow
    status TEXT NOT NULL DEFAULT 'pendente',

    dados_adicionais JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.ocorrencia_adm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read adm" ON public.ocorrencia_adm FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert adm" ON public.ocorrencia_adm FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update adm" ON public.ocorrencia_adm FOR UPDATE TO authenticated USING (true);



-- 3. Modify Attachments to support Adm

-- Compatibility fix: If we are migrating from v2 schema where column was 'ocorrencia_id', rename it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attachments' AND column_name = 'ocorrencia_id') THEN
        ALTER TABLE public.attachments RENAME COLUMN ocorrencia_id TO ocorrencia_laudo_id;
    END IF;
END $$;

ALTER TABLE public.attachments ADD COLUMN ocorrencia_adm_id UUID REFERENCES public.ocorrencia_adm(id) ON DELETE CASCADE;

-- Add constraint to ensure attachment belongs to only one type (Laudo OR Adm)
-- Note: 'ocorrencia_laudo_id' already exists (either from base migration or renamed above)
ALTER TABLE public.attachments ADD CONSTRAINT check_origin CHECK (
    (ocorrencia_laudo_id IS NOT NULL AND ocorrencia_adm_id IS NULL) OR
    (ocorrencia_laudo_id IS NULL AND ocorrencia_adm_id IS NOT NULL)
);


-- Update RLS for public access if needed (For Adm, usually internal only, but if needed:)
-- DROP POLICY IF EXISTS "Public read attachments" ON public.attachments; 
-- CREATE POLICY "Public read attachments" ON public.attachments FOR SELECT TO anon 
-- USING (
--     (EXISTS (SELECT 1 FROM public.ocorrencia_laudo WHERE id = attachments.ocorrencia_laudo_id AND public_token IS NOT NULL))
-- );


-- 4. Protocol Generator (Adm)
CREATE OR REPLACE FUNCTION public.generate_protocol_adm()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 13) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.ocorrencia_adm
    WHERE substring(protocolo from 5 for 8) = date_part;
    NEW.protocolo := 'ADM-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_adm BEFORE INSERT ON public.ocorrencia_adm
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_adm();
