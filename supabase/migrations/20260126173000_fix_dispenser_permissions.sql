-- 1. Ensure Columns Exist (Safety check)
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS finalizado_por TEXT;
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.chamados_dispenser ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;

-- Banheiro
ALTER TABLE public.chamados_banheiro ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

-- Ar Condicionado
ALTER TABLE public.chamados_ar_condicionado ADD COLUMN IF NOT EXISTS finalizado_por TEXT;

-- 2. Enable RLS
ALTER TABLE public.chamados_dispenser ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_banheiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_ar_condicionado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. Grant Permissions to Anon (Crucial for Mobile/Guest access)
GRANT ALL ON public.chamados_dispenser TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.chamados_dispenser TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.chamados_banheiro TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chamados_ar_condicionado TO anon, authenticated;
GRANT SELECT ON public.tenants TO anon, authenticated;

-- 4. Tenants Policy (Public Read)
DROP POLICY IF EXISTS "Public Read Tenants" ON public.tenants;
CREATE POLICY "Public Read Tenants" ON public.tenants FOR SELECT TO anon, authenticated USING (true);

-- 5. Dispenser Policies
DROP POLICY IF EXISTS "Public Insert Dispenser" ON public.chamados_dispenser;
CREATE POLICY "Public Insert Dispenser" ON public.chamados_dispenser FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Dispenser" ON public.chamados_dispenser;
CREATE POLICY "Public Select Dispenser" ON public.chamados_dispenser FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Update Dispenser" ON public.chamados_dispenser;
CREATE POLICY "Public Update Dispenser" ON public.chamados_dispenser FOR UPDATE TO anon, authenticated USING (true);

-- 6. Banheiro Policies
DROP POLICY IF EXISTS "Public Insert Banheiro" ON public.chamados_banheiro;
CREATE POLICY "Public Insert Banheiro" ON public.chamados_banheiro FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select Banheiro" ON public.chamados_banheiro;
CREATE POLICY "Public Select Banheiro" ON public.chamados_banheiro FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Update Banheiro" ON public.chamados_banheiro;
CREATE POLICY "Public Update Banheiro" ON public.chamados_banheiro FOR UPDATE TO anon, authenticated USING (true);

-- 7. Ar Condicionado Policies
DROP POLICY IF EXISTS "Public Insert ArCond" ON public.chamados_ar_condicionado;
CREATE POLICY "Public Insert ArCond" ON public.chamados_ar_condicionado FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Select ArCond" ON public.chamados_ar_condicionado;
CREATE POLICY "Public Select ArCond" ON public.chamados_ar_condicionado FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public Update ArCond" ON public.chamados_ar_condicionado;
CREATE POLICY "Public Update ArCond" ON public.chamados_ar_condicionado FOR UPDATE TO anon, authenticated USING (true);

-- 8. Refresh Cache
NOTIFY pgrst, 'reload config';
