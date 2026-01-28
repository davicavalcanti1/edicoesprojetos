-- PART 1: BASE + LAUDO SCHEMA

-- 1. Create Profiles Table (Users & Permissions)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create Doctors Table (Medicos)
CREATE TABLE public.medicos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    crm TEXT,
    especialidade TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read medicos" ON public.medicos FOR SELECT USING (true);
CREATE POLICY "Admin write medicos" ON public.medicos FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.medicos (id, nome) VALUES 
 ('dr_andre_ventura', 'Dr. André Ventura da Nóbrega'),
 ('dr_arquimedes_aires', 'Dr. Arquimedes Aires Braga de Lira'),
 ('dr_arthur_jose', 'Dr. Arthur José Ventura da Nóbrega'),
 ('dr_davi_cavalcanti', 'Dr. Davi Cavalcanti'),
 ('dr_diego_furtado', 'Dr. Diego Furtado F. Cândido'),
 ('dr_diogo_araujo', 'Dr. Diogo Araújo'),
 ('dr_ednaldo_marques', 'Dr. Ednaldo Marques Bezerra Filho'),
 ('dr_felix_soares', 'Dr. Félix Soares Nóbrega'),
 ('dr_filipe_anderson', 'Dr. Filipe Anderson de Souza Florentino'),
 ('dr_heraclio_almeida', 'Dr. Heráclio Almeida da Costa'),
 ('dr_heverton_leal', 'Dr. Heverton Leal Ernesto de Amorim'),
 ('dr_igor_silveira', 'Dr. Igor Silveira de Castro Guerreiro Gondim'),
 ('dr_jannie_mirror', 'Dr. Janniê de Miranda Araújo'),
 ('dr_jose_celio', 'Dr. José Célio Couto'),
 ('dr_jose_roberto', 'Dr. José Roberto Maia Júnior'),
 ('dr_mario_henrique', 'Dr. Mario Henrique de Melo Carneiro'),
 ('dr_pericles_almeida', 'Dr. Péricles Almeida da Costa'),
 ('dr_rafael_borges', 'Dr. Rafael Borges Tavares Cavalcanti'),
 ('dr_raiff_ramalho', 'Dr. Raiff Ramalho Cavalcanti'),
 ('dr_ramonie_miranda', 'Dr. Ramoniê de Miranda Araújo'),
 ('dr_rennah_goncalves', 'Dr. Rennah Gonçalves dos Santos'),
 ('dr_rodolfo_nunes', 'Dr. Rodolfo Nunes'),
 ('dr_saulo_nobrega', 'Dr. Saulo Nóbrega'),
 ('dr_ygor_felipe', 'Dr. Ygor W. Felipe Barbosa'),
 ('dra_adriana_susanne', 'Dra. Adriana Susanne Jalcira Jeunon'),
 ('dra_cinthia_milena', 'Dra. Cinthia Milena Veiga de Oliveira Marques'),
 ('dra_fernanda_borges', 'Dra. Fernanda Borges Tavares Cavalcanti'),
 ('dra_larissa_mendonca', 'Dra. Larissa Mendonça de Souza'),
 ('dra_larissa_nobrega', 'Dra. Larissa Nóbrega Leal de Amorim'),
 ('dra_mariana_lellis', 'Dra. Mariana Lellis de Macedo'),
 ('dra_miriam_maria', 'Dra. Míriam Maria Barbosa Albino'),
 ('dra_priscila_borba', 'Dra. Priscila Borba'),
 ('dra_rafaella_tiburtino', 'Dra. Rafaella Tiburtino')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome;


-- 3. Create Ocorrencia Laudo Table
CREATE TABLE public.ocorrencia_laudo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocolo TEXT UNIQUE NOT NULL,
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Patient
    paciente_nome TEXT NOT NULL,
    paciente_cpf TEXT,
    paciente_data_nascimento DATE,
    paciente_telefone TEXT,
    
    -- Exam
    exame_tipo TEXT NOT NULL, 
    exame_regiao TEXT,        
    exame_data DATE,          
    exame_unidade TEXT,       
    
    medico_responsavel_laudo TEXT, 
    medico_responsavel_laudo_id TEXT,
    
    laudo_entregue BOOLEAN,

    -- Review Details
    motivo_revisao TEXT NOT NULL,
    motivo_revisao_outro TEXT,
    
    tipo_discrepancia TEXT,
    
    -- Actions
    acao_tomada TEXT, 
    pessoas_comunicadas TEXT,

    dados_adicionais JSONB DEFAULT '{}'::jsonb, 

    -- Status
    status TEXT NOT NULL DEFAULT 'aguardando_envio',
    
    -- Triage & Doctor
    triagem_nivel INTEGER, 
    triagem_observacao TEXT,
    triagem_realizada_em TIMESTAMPTZ,
    triagem_realizada_por UUID REFERENCES public.profiles(id),

    medico_revisor_nome TEXT,
    medico_revisor_id TEXT,
    public_token TEXT UNIQUE,
    mensagem_envio_medico TEXT,
    mensagem_medico_resposta TEXT,
    data_envio_medico TIMESTAMPTZ,
    data_resposta_medico TIMESTAMPTZ,

    -- Outcome
    desfecho_tipo TEXT,
    desfecho_observacao TEXT,
    finalizada_em TIMESTAMPTZ,
    finalizada_por UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.ocorrencia_laudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read public.ocorrencia_laudo" ON public.ocorrencia_laudo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert public.ocorrencia_laudo" ON public.ocorrencia_laudo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update public.ocorrencia_laudo" ON public.ocorrencia_laudo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Public access token" ON public.ocorrencia_laudo FOR SELECT TO anon USING (public_token IS NOT NULL);
CREATE POLICY "Public update token" ON public.ocorrencia_laudo FOR UPDATE TO anon USING (public_token IS NOT NULL);


-- 4. Initial Attachments Table (Can support Laudo primarily)
CREATE TABLE public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ocorrencia_laudo_id UUID REFERENCES public.ocorrencia_laudo(id) ON DELETE CASCADE,
    
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, 
    file_type TEXT, 
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read attachments" ON public.attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Upload attachments" ON public.attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public read attachments" ON public.attachments FOR SELECT TO anon 
USING (EXISTS (SELECT 1 FROM public.ocorrencia_laudo WHERE id = attachments.ocorrencia_laudo_id AND public_token IS NOT NULL));


-- 5. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('ocorrencia-attachments', 'ocorrencia-attachments', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ocorrencia-attachments');
CREATE POLICY "Auth Select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ocorrencia-attachments');
CREATE POLICY "Public Select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ocorrencia-attachments');


-- 6. Protocol Generator (Laudo)
CREATE OR REPLACE FUNCTION public.generate_protocol_laudo()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := to_char(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 15) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.ocorrencia_laudo
    WHERE substring(protocolo from 7 for 8) = date_part;
    NEW.protocolo := 'LAUDO-' || date_part || '-' || lpad(sequence_part::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_protocol_laudo BEFORE INSERT ON public.ocorrencia_laudo
FOR EACH ROW EXECUTE PROCEDURE public.generate_protocol_laudo();
