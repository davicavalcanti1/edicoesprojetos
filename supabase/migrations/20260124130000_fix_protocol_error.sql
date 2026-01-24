
-- 1. Create a compatibility alias for the missing function just in case legacy defaults are still lingering
CREATE OR REPLACE FUNCTION public.generate_protocol_number(p_tenant_id uuid) 
RETURNS text 
LANGUAGE plpgsql 
AS $$
BEGIN
    -- Forward to the new generic protocol generator with a fallback prefix/table
    RETURN public.generate_protocol(p_tenant_id, 'GEN', 'occurrences');
END;
$$;

-- 2. Clean up the 'occurrences' table to ensure it uses the NEW trigger, not an old DEFAULT
ALTER TABLE public.occurrences ALTER COLUMN protocolo DROP DEFAULT;

-- 3. Verify other tables just in case
ALTER TABLE public.chamados_ar_condicionado ALTER COLUMN protocolo DROP DEFAULT;
ALTER TABLE public.chamados_dispenser ALTER COLUMN protocolo DROP DEFAULT;
ALTER TABLE public.chamados_banheiro ALTER COLUMN protocolo DROP DEFAULT;
ALTER TABLE public.ocorrencias_adm ALTER COLUMN protocolo DROP DEFAULT;
ALTER TABLE public.ocorrencias_enf ALTER COLUMN protocolo DROP DEFAULT;
ALTER TABLE public.ocorrencias_laudo ALTER COLUMN protocolo DROP DEFAULT;

-- 4. Notify PostgREST to reload schema cache (standard trick: notify pgrst)
NOTIFY pgrst, 'reload config';
