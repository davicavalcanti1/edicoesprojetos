
CREATE OR REPLACE FUNCTION public.generate_admin_protocol_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  v_protocol TEXT; -- Renamed from protocol to avoid ambiguity
BEGIN
  -- Get today's date
  today_date := to_char(now(), 'YYYYMMDD');
  
  -- Get next sequence number for today from administrative_occurrences
  -- Protocol format: ADM-YYYYMMDD-SEQ
  -- Explicitly qualify column names with table alias or just rely on distinct name
  SELECT COALESCE(MAX(
    NULLIF(
      regexp_replace(protocol, '.*-(\d+)$', '\1'),
      protocol
    )::INTEGER
  ), 0) + 1
  INTO sequence_num
  FROM public.administrative_occurrences
  WHERE tenant_id = p_tenant_id
  AND protocol LIKE 'ADM-' || today_date || '-%';
  
  -- Generate protocol: ADM-YYYYMMDD-SEQ
  v_protocol := 'ADM-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN v_protocol;
END;
$$;

-- Update the trigger function to use the new return if it used the variable name?
-- The trigger calls the function: NEW.protocol := public.generate_admin_protocol_number(...)
-- This part is fine.
