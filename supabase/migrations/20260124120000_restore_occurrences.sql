
-- Restore generic occurrences table for 'livre' and 'paciente' types
CREATE TABLE IF NOT EXISTS public.occurrences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    protocolo text NOT NULL UNIQUE,
    tipo text NOT NULL, -- 'paciente', 'livre', 'simples'
    subtipo text,
    descricao text NOT NULL,
    status text DEFAULT 'registrada',
    
    paciente_info jsonb, -- Flexible patient info for patient occurrences
    dados_especificos jsonb DEFAULT '{}'::jsonb,
    
    criado_por uuid REFERENCES public.profiles(id),
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View Occurrences" ON public.occurrences FOR SELECT 
USING (tenant_id = public.get_my_tenant());

CREATE POLICY "Create Occurrences" ON public.occurrences FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant());

CREATE POLICY "Update Occurrences" ON public.occurrences FOR UPDATE
USING (tenant_id = public.get_my_tenant() AND (public.get_my_role() = 'admin' OR criado_por = auth.uid()));

-- Trigger for Protocol
CREATE OR REPLACE FUNCTION public.set_gen_protocol() RETURNS trigger AS $$
BEGIN
    -- Ensure generate_protocol exists, otherwise fallback or error
    -- Assuming generate_protocol(tenant_id, prefix, table_name) exists from previous migration
    NEW.protocolo := public.generate_protocol(NEW.tenant_id, 'GEN', 'occurrences');
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_gen_protocol ON public.occurrences;
CREATE TRIGGER tr_gen_protocol BEFORE INSERT ON public.occurrences FOR EACH ROW EXECUTE FUNCTION public.set_gen_protocol();

-- Trigger for Updated At
CREATE TRIGGER tr_gen_updated BEFORE UPDATE ON public.occurrences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
