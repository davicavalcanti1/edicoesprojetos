-- 1. Create Tenants table if not exists (Essential for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tenants" ON public.tenants FOR SELECT USING (true); -- Or authenticated

-- 2. Insert Default Tenant
INSERT INTO public.tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'Imago Padrão', 'imago-default')
ON CONFLICT (id) DO NOTHING;

-- 3. Add tenant_id to profiles if missing (Safeguard)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $$;

-- 4. Update existing profiles to have default tenant_id if null
UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE tenant_id IS NULL;

-- 5. Ensure the current user is linked to this tenant
UPDATE public.profiles
SET tenant_id = '00000000-0000-0000-0000-000000000000'
WHERE id = '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd'; -- Seu UUID
