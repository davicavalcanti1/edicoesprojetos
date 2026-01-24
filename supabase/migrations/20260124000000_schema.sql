
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS & ROLES
-- ==========================================

-- Roles updated as per user request
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'medico',      -- user laudo
    'rh',          -- user rh
    'enfermagem',  -- user enf
    'estoque',     -- user estoq
    'recepcao',    -- extra generic user
    'user'         -- default
);

CREATE TYPE public.ticket_status AS ENUM (
    'aberto',
    'em_andamento',
    'concluido',
    'cancelado'
);

-- ==========================================
-- 2. CORE TABLES (Tenants & Profiles)
-- ==========================================

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    logo_url text,
    primary_color text DEFAULT '#0066CC',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Profiles linked to Auth Users
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL, 
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 3. SPECIFIC TABLES (SEPARATED)
-- ==========================================

-- 3.1 AR CONDICIONADO
CREATE TABLE public.chamados_ar_condicionado (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    localizacao text NOT NULL, -- Sala/Setor
    descricao text NOT NULL,
    
    -- Dados Específicos
    modelo text,
    numero_serie text,
    tag_equipamento text,
    
    status public.ticket_status DEFAULT 'aberto'::public.ticket_status NOT NULL,
    prioridade text DEFAULT 'media',
    
    criado_por uuid REFERENCES public.profiles(id), -- Pode ser null se via QR Code anonimo
    solicitante_info jsonb, -- { nome, contato } se anonimo
    
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    resolvido_em timestamp with time zone,
    resolvido_por uuid REFERENCES public.profiles(id)
);

-- 3.2 DISPENSER
CREATE TABLE public.chamados_dispenser (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    localizacao text NOT NULL,
    
    -- Dados Específicos
    tipo_insumo text, -- Alcool, Sabonete, Papel
    problema text, -- Vazio, Quebrado, Pilha fraca
    
    status public.ticket_status DEFAULT 'aberto'::public.ticket_status NOT NULL,
    
    criado_por uuid REFERENCES public.profiles(id),
    solicitante_info jsonb,
    
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    resolvido_em timestamp with time zone,
    resolvido_por uuid REFERENCES public.profiles(id)
);

-- 3.3 BANHEIRO
CREATE TABLE public.chamados_banheiro (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    localizacao text NOT NULL,
    
    -- Dados Específicos
    problema text, -- Sujo, Entupido, Sem papel, Torneira vazando
    observacao text,
    
    status public.ticket_status DEFAULT 'aberto'::public.ticket_status NOT NULL,
    
    criado_por uuid REFERENCES public.profiles(id),
    solicitante_info jsonb,
    
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    resolvido_em timestamp with time zone,
    resolvido_por uuid REFERENCES public.profiles(id)
);

-- 3.4 OCORRÊNCIAS ADMINISTRATIVAS (RH)
CREATE TABLE public.ocorrencias_adm (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    
    titulo text NOT NULL,
    descricao text NOT NULL,
    categoria text, -- Faturamento, Agendamento, Pessoal, Infraestrutura, TI
    
    status text DEFAULT 'pendente', -- pendente, em_analise, concluido
    prioridade text DEFAULT 'media',
    
    criado_por uuid REFERENCES public.profiles(id) NOT NULL,
    atribuido_a uuid REFERENCES public.profiles(id), -- Quem do RH está cuidando
    
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    finalizado_em timestamp with time zone
);

-- 3.5 OCORRÊNCIAS ENFERMAGEM
CREATE TABLE public.ocorrencias_enf (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    
    paciente_nome text,
    paciente_prontuario text,
    data_incidente timestamp with time zone,
    
    tipo_incidente text NOT NULL, -- Extravasamento, Queda, Reação Adversa
    descricao_detalhada text NOT NULL,
    conduta_tomada text,
    
    -- Campos específicos JSON para flexibilidade (ex: volume contraste)
    dados_clinicos jsonb DEFAULT '{}'::jsonb,
    
    status text DEFAULT 'registrada', -- registrada, analise_tecnica, concluida
    notificacao_id text, -- ID externo se notificado
    
    criado_por uuid REFERENCES public.profiles(id) NOT NULL,
    
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

-- 3.6 REVISÃO DE LAUDO (MÉDICA)
CREATE TABLE public.ocorrencias_laudo (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    
    paciente_nome text NOT NULL,
    exame_tipo text NOT NULL,
    data_exame date,
    accession_number text, -- Identificador do exame no PACS
    
    motivo_revisao text NOT NULL, -- Erro diagnóstico, Adendo, Concordância
    prioridade text DEFAULT 'rotina', -- urgente, rotina
    
    medico_solicitante text, -- Nome do médico externo
    medico_responsavel uuid REFERENCES public.profiles(id), -- Radiologista que laudou
    
    descricao_solicitacao text NOT NULL,
    resposta_radiologista text,
    
    status text DEFAULT 'pendente', -- pendente, em_revisao, corrigido, mantido, cancelado
    
    criado_por uuid REFERENCES public.profiles(id) NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now(),
    
    -- Link publico para medico externo ver
    public_token text UNIQUE
);

-- 3.7 ESTOQUE (INVENTORY)
CREATE TABLE public.estoque_itens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    nome text NOT NULL,
    categoria text,
    quantidade_atual integer DEFAULT 0,
    quantidade_minima integer DEFAULT 5,
    unidade text DEFAULT 'un',
    localizacao text,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.estoque_movimentacoes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id uuid REFERENCES public.estoque_itens(id) ON DELETE CASCADE NOT NULL,
    tipo text CHECK (tipo IN ('entrada', 'saida')),
    quantidade integer NOT NULL,
    motivo text,
    realizado_por uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Attachment Table (Unified or separated? user said Separate EVERYTHING. But Storage acts as one)
-- We will create a unified attachment table linking to the specific table ID via a 'table_name' column or just specialized tables.
-- Let's stick to specialized attachment tables to keep it truly separated as requested.

CREATE TABLE public.attachments_generico (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    
    origin_table text NOT NULL, -- 'ac', 'dispenser', 'banheiro', 'adm', 'enf', 'laudo'
    origin_id uuid NOT NULL, -- ID do registro na tabela de origem
    
    file_url text NOT NULL,
    file_name text,
    file_type text,
    
    uploaded_by uuid REFERENCES public.profiles(id),
    uploaded_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 4. UTILS & TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

-- Protocol Generator (Generic)
CREATE OR REPLACE FUNCTION public.generate_protocol(
    p_tenant_id uuid,
    p_prefix text,
    p_table text
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    tenant_slug TEXT;
    today_date TEXT;
    sequence_num INTEGER;
    protocol TEXT;
    query_str TEXT;
BEGIN
    SELECT slug INTO tenant_slug FROM public.tenants WHERE id = p_tenant_id;
    today_date := to_char(now(), 'YYYYMMDD');
    
    query_str := format('SELECT COALESCE(MAX(CAST(substring(protocolo from ''-(\d+)$'') AS INTEGER)), 0) + 1 FROM public.%I WHERE tenant_id = %L AND protocolo LIKE %L', p_table, p_tenant_id, UPPER(tenant_slug) || '-' || p_prefix || '-' || today_date || '-%');
    
    EXECUTE query_str INTO sequence_num;
    
    protocol := UPPER(tenant_slug) || '-' || p_prefix || '-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN protocol;
END;
$$;

-- Triggers for Protocol
CREATE OR REPLACE FUNCTION public.set_ac_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'AC', 'chamados_ar_condicionado');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_dispenser_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'DSP', 'chamados_dispenser');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_banheiro_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'WC', 'chamados_banheiro');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_adm_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'ADM', 'ocorrencias_adm');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_enf_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'ENF', 'ocorrencias_enf');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_laudo_protocol() RETURNS trigger AS $$
BEGIN
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'MED', 'ocorrencias_laudo');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ac_protocol BEFORE INSERT ON public.chamados_ar_condicionado FOR EACH ROW EXECUTE FUNCTION public.set_ac_protocol();
CREATE TRIGGER tr_dispenser_protocol BEFORE INSERT ON public.chamados_dispenser FOR EACH ROW EXECUTE FUNCTION public.set_dispenser_protocol();
CREATE TRIGGER tr_banheiro_protocol BEFORE INSERT ON public.chamados_banheiro FOR EACH ROW EXECUTE FUNCTION public.set_banheiro_protocol();
CREATE TRIGGER tr_adm_protocol BEFORE INSERT ON public.ocorrencias_adm FOR EACH ROW EXECUTE FUNCTION public.set_adm_protocol();
CREATE TRIGGER tr_enf_protocol BEFORE INSERT ON public.ocorrencias_enf FOR EACH ROW EXECUTE FUNCTION public.set_enf_protocol();
CREATE TRIGGER tr_laudo_protocol BEFORE INSERT ON public.ocorrencias_laudo FOR EACH ROW EXECUTE FUNCTION public.set_laudo_protocol();

-- Triggers for UpdatedAt
CREATE TRIGGER tr_ac_updated BEFORE UPDATE ON public.chamados_ar_condicionado FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_dispenser_updated BEFORE UPDATE ON public.chamados_dispenser FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_banheiro_updated BEFORE UPDATE ON public.chamados_banheiro FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_adm_updated BEFORE UPDATE ON public.ocorrencias_adm FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_enf_updated BEFORE UPDATE ON public.ocorrencias_enf FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_laudo_updated BEFORE UPDATE ON public.ocorrencias_laudo FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==========================================
-- 5. NEW USER HANDLING
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'imago' LIMIT 1;
  IF default_tenant_id IS NULL THEN
     INSERT INTO public.tenants (name, slug) VALUES ('Clínica Imago', 'imago')
     RETURNING id INTO default_tenant_id;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, full_name, email, role)
  VALUES (
    NEW.id,
    default_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'user' -- Default role, admin must change it manually
  );
  
  -- If it's the very first user, make admin
  IF (SELECT count(*) FROM public.profiles) = 1 THEN
      UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- 6. RLS POLICIES
-- ==========================================

-- Helper
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_ar_condicionado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_dispenser ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_banheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias_adm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias_enf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias_laudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "View Profiles same tenant" ON public.profiles FOR SELECT USING (tenant_id = public.get_my_tenant());
CREATE POLICY "Update self" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin manage all" ON public.profiles USING (public.get_my_role() = 'admin');

-- AR CONDICIONADO / DISPENSER / BANHEIRO (Maintenance)
-- Admin sees all. Others see what? Maybe all for now if they are Staff.
CREATE POLICY "View Maintenance" ON public.chamados_ar_condicionado FOR SELECT USING (tenant_id = public.get_my_tenant());
CREATE POLICY "Create Maintenance" ON public.chamados_ar_condicionado FOR INSERT WITH CHECK (true); -- Public/QR
CREATE POLICY "Update Maintenance Admin" ON public.chamados_ar_condicionado FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "View Maintenance Disp" ON public.chamados_dispenser FOR SELECT USING (tenant_id = public.get_my_tenant());
CREATE POLICY "Create Maintenance Disp" ON public.chamados_dispenser FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Maintenance Disp" ON public.chamados_dispenser FOR UPDATE USING (public.get_my_role() = 'admin');

CREATE POLICY "View Maintenance WC" ON public.chamados_banheiro FOR SELECT USING (tenant_id = public.get_my_tenant());
CREATE POLICY "Create Maintenance WC" ON public.chamados_banheiro FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Maintenance WC" ON public.chamados_banheiro FOR UPDATE USING (public.get_my_role() = 'admin');

-- ADM
CREATE POLICY "View Adm" ON public.ocorrencias_adm FOR SELECT 
USING (tenant_id = public.get_my_tenant() AND (public.get_my_role() IN ('admin', 'rh') OR criado_por = auth.uid()));

CREATE POLICY "Create Adm" ON public.ocorrencias_adm FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant());

CREATE POLICY "Update Adm" ON public.ocorrencias_adm FOR UPDATE
USING (public.get_my_role() IN ('admin', 'rh'));

-- ENF
CREATE POLICY "View Enf" ON public.ocorrencias_enf FOR SELECT 
USING (tenant_id = public.get_my_tenant() AND (public.get_my_role() IN ('admin', 'enfermagem') OR criado_por = auth.uid()));

CREATE POLICY "Create Enf" ON public.ocorrencias_enf FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant() AND public.get_my_role() IN ('admin', 'enfermagem'));

CREATE POLICY "Update Enf" ON public.ocorrencias_enf FOR UPDATE
USING (public.get_my_role() IN ('admin', 'enfermagem'));

-- LAUDO
CREATE POLICY "View Laudo" ON public.ocorrencias_laudo FOR SELECT 
USING (tenant_id = public.get_my_tenant() AND (public.get_my_role() IN ('admin', 'medico') OR criado_por = auth.uid())); -- OR public token logic

CREATE POLICY "Create Laudo" ON public.ocorrencias_laudo FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant() AND public.get_my_role() IN ('admin', 'medico', 'recepcao'));

CREATE POLICY "Update Laudo" ON public.ocorrencias_laudo FOR UPDATE
USING (public.get_my_role() IN ('admin', 'medico'));

-- ESTOQUE
CREATE POLICY "View Estoque" ON public.estoque_itens FOR SELECT 
USING (tenant_id = public.get_my_tenant());

CREATE POLICY "Manage Estoque" ON public.estoque_itens USING (public.get_my_role() IN ('admin', 'estoque'));
CREATE POLICY "Manage Estoque Mov" ON public.estoque_movimentacoes USING (public.get_my_role() IN ('admin', 'estoque'));


-- ==========================================
-- 7. STORAGE
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'attachments' );
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'attachments' );

