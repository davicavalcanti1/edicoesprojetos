-- Enable RLS (if not already)
ALTER TABLE public.chamados_dispenser ENABLE ROW LEVEL SECURITY;

-- Policy for Opening (Inserting) - Allow Anon/Authenticated
DROP POLICY IF EXISTS "Permitir Insercao Dispenser Publico" ON public.chamados_dispenser;
CREATE POLICY "Permitir Insercao Dispenser Publico" ON public.chamados_dispenser
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy for Reading (Select) - Needed for "FinalizarChamado" page to load details
DROP POLICY IF EXISTS "Permitir Leitura Dispenser Publico" ON public.chamados_dispenser;
CREATE POLICY "Permitir Leitura Dispenser Publico" ON public.chamados_dispenser
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy for Updating (Finalize) - Needed for "FinalizarChamado" to save
DROP POLICY IF EXISTS "Permitir Atualizacao Dispenser Publico" ON public.chamados_dispenser;
CREATE POLICY "Permitir Atualizacao Dispenser Publico" ON public.chamados_dispenser
FOR UPDATE
TO anon, authenticated
USING (true);

-- Repeat for other maintenance tables to be safe
ALTER TABLE public.chamados_banheiro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir Insercao Banheiro Publico" ON public.chamados_banheiro;
CREATE POLICY "Permitir Insercao Banheiro Publico" ON public.chamados_banheiro
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir Leitura Banheiro Publico" ON public.chamados_banheiro;
CREATE POLICY "Permitir Leitura Banheiro Publico" ON public.chamados_banheiro
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir Atualizacao Banheiro Publico" ON public.chamados_banheiro;
CREATE POLICY "Permitir Atualizacao Banheiro Publico" ON public.chamados_banheiro
FOR UPDATE TO anon, authenticated USING (true);

-- Ar Condicionado
ALTER TABLE public.chamados_ar_condicionado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir Insercao ArCond Publico" ON public.chamados_ar_condicionado;
CREATE POLICY "Permitir Insercao ArCond Publico" ON public.chamados_ar_condicionado
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir Leitura ArCond Publico" ON public.chamados_ar_condicionado;
CREATE POLICY "Permitir Leitura ArCond Publico" ON public.chamados_ar_condicionado
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir Atualizacao ArCond Publico" ON public.chamados_ar_condicionado;
CREATE POLICY "Permitir Atualizacao ArCond Publico" ON public.chamados_ar_condicionado
FOR UPDATE TO anon, authenticated USING (true);

-- Force reload schema cache
NOTIFY pgrst, 'reload config';
