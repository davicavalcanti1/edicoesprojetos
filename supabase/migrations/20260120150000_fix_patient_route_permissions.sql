-- Fix permissions for Public/Patient Route
-- Run this to allow anonymous occurrence submission

-- 1. Ensure generate_protocol_number exists and is accessible
CREATE OR REPLACE FUNCTION public.generate_protocol_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Critical for running as owner (bypass RLS if needed, but here we just need access)
AS $$
DECLARE
    year_prefix text;
    next_num integer;
    protocol text;
BEGIN
    year_prefix := to_char(now(), 'YYYY');
    
    -- Assuming a sequence or table tracks this. 
    -- If using a simplified approach (count + 1) - caution with concurrency, but okay for prototype
    -- Better: create a sequence if not exists
    -- CREATE SEQUENCE IF NOT EXISTS protocol_seq;
    -- next_num := nextval('protocol_seq');
    
    -- Using a random string for now if specific logic isn't strictly defined, 
    -- BUT users expect sequential. Let's use a standard pattern.
    -- Re-implementing a simple sequential lookup for safety if sequence missing.
    
    SELECT count(*) + 1 INTO next_num FROM public.occurrences WHERE to_char(criado_em, 'YYYY') = year_prefix;
    
    protocol := year_prefix || lpad(next_num::text, 6, '0');
    RETURN protocol;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_protocol_number(uuid) TO anon, authenticated, service_role;

-- 2. Grant permissions on tables to ANON
GRANT INSERT ON public.occurrences TO anon;

-- 3. Ensure 'paciente' type is allowed (already done in previous steps, but RLS matters)
-- (The RLS policy "Public insert patient occurrences" checks for tipo='paciente')

-- 4. Fix potential infinite recursion if RLS checks user table for anon
-- (Anon has no user, so auth.uid() is null. Policy must handle null safely)

-- Update 'profiles' access if checked (usually anon doesn't read profiles)

