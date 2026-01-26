-- Fix RLS for Enfermagem (allow user to create)
DROP POLICY IF EXISTS "Create Enf" ON public.ocorrencias_enf;
CREATE POLICY "Create Enf" ON public.ocorrencias_enf FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant() AND public.get_my_role() IN ('admin', 'enfermagem', 'user'));

-- Fix RLS for Laudo (allow user to create)
DROP POLICY IF EXISTS "Create Laudo" ON public.ocorrencias_laudo;
CREATE POLICY "Create Laudo" ON public.ocorrencias_laudo FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant() AND public.get_my_role() IN ('admin', 'medico', 'recepcao', 'user'));

-- Create unified Attachments table (Polymorphic support)
-- This replaces reliance on occurrence_attachments which had rigid FK
CREATE TABLE IF NOT EXISTS public.attachments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    
    origin_table text NOT NULL, -- e.g. 'ocorrencias_enf', 'ocorrencias_laudo'
    origin_id uuid NOT NULL,    -- The record ID
    
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text,
    file_size integer,
    is_image boolean DEFAULT false,
    
    uploaded_by uuid REFERENCES public.profiles(id),
    uploaded_at timestamp with time zone DEFAULT now()
);

-- RLS for Attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View Attachments" ON public.attachments;
CREATE POLICY "View Attachments" ON public.attachments FOR SELECT 
USING (tenant_id = public.get_my_tenant());

DROP POLICY IF EXISTS "Create Attachments" ON public.attachments;
CREATE POLICY "Create Attachments" ON public.attachments FOR INSERT 
WITH CHECK (tenant_id = public.get_my_tenant());

DROP POLICY IF EXISTS "Manage Attachments" ON public.attachments;
CREATE POLICY "Manage Attachments" ON public.attachments FOR ALL
USING (tenant_id = public.get_my_tenant() AND (public.get_my_role() = 'admin' OR uploaded_by = auth.uid()));

-- Storage Bucket (Ensure it exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'attachments' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'attachments' );
