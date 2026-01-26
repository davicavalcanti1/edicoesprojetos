
-- 1. Upgrade maintenance_records view to include resolution data
DROP VIEW IF EXISTS public.operacional_chamados_view;
DROP VIEW IF EXISTS public.maintenance_records;

-- ADD COLUMNS FIRST
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_banheiro ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_ar_condicionado ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

CREATE OR REPLACE VIEW public.maintenance_records AS
SELECT 
    id, 
    criado_em as created_at, 
    'ar_condicionado'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_ar_condicionado
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'banheiro'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    problema as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_banheiro
UNION ALL
SELECT 
    id, 
    criado_em as created_at, 
    'dispenser'::text as tipo_origem, 
    'geral'::text as subtipo,
    localizacao, 
    observacao as descricao, 
    status::text, 
    protocolo, 
    tenant_id,
    resolvido_em,
    finalizado_por
FROM public.chamados_dispenser;

-- 2. Create the View expected by Dashboards
CREATE OR REPLACE VIEW public.operacional_chamados_view AS
SELECT
    id,
    created_at as data_abertura,
    tipo_origem as tipo_chamado,
    status,
    localizacao,
    protocolo,
    descricao as problema,
    descricao as descricao_detalhada,
    resolvido_em as data_fechamento,
    EXTRACT(EPOCH FROM (COALESCE(resolvido_em, NOW()) - created_at))/3600 as tempo_resolucao_horas,
    tenant_id,
    finalizado_por,
    null::text as observacoes_fechamento
FROM public.maintenance_records;

-- 3. Update ocorrencias_adm to support Admin Form features (Employee, Signatures, Attachments)
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS occurrence_date DATE;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS type TEXT; -- stored separately from categoria/subtype
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS subtype TEXT;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS coordinator_signature_path TEXT;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS employee_signature_path TEXT;
ALTER TABLE public.ocorrencias_adm ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- 4. Create Alias View for administrative_occurrences to fix legacy code references
CREATE OR REPLACE VIEW public.administrative_occurrences AS
SELECT 
    id,
    tenant_id,
    criado_por as created_by,
    criado_em as created_at,
    protocolo as protocol,
    -- Map new columns
    employee_name,
    occurrence_date,
    type,
    subtype,
    descricao as description,
    attachments,
    coordinator_signature_path,
    employee_signature_path,
    status,
    signed_at
FROM public.ocorrencias_adm;

-- 5. Permissions
GRANT SELECT ON public.maintenance_records TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.operacional_chamados_view TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.administrative_occurrences TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.ocorrencias_adm TO postgres, anon, authenticated, service_role;

-- 6. Storage Bucket for Admin Occurrences
INSERT INTO storage.buckets (id, name, public) VALUES ('occurrence-attachments', 'occurrence-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Admin" ON storage.objects;
CREATE POLICY "Public Access Admin" ON storage.objects FOR SELECT USING ( bucket_id = 'occurrence-attachments' );

DROP POLICY IF EXISTS "Auth Upload Admin" ON storage.objects;
CREATE POLICY "Auth Upload Admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'occurrence-attachments' );

-- 7. Force Refresh
NOTIFY pgrst, 'reload config';
