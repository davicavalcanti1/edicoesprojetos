-- Create table
CREATE TABLE IF NOT EXISTS public.administrative_occurrences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    protocol text UNIQUE,
    employee_name text NOT NULL,
    occurrence_date date NOT NULL,
    type text NOT NULL,
    subtype text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pendente' NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_by uuid NOT NULL,
    updated_by uuid,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.administrative_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies for Administrative Occurrences
-- RH and Admin can VIEW ALL
CREATE POLICY "RH and Admin can view all administrative occurrences"
ON public.administrative_occurrences FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh')
);

-- RH and Admin can INSERT
CREATE POLICY "RH and Admin can insert administrative occurrences"
ON public.administrative_occurrences FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh')
);

-- RH and Admin can UPDATE
CREATE POLICY "RH and Admin can update administrative occurrences"
ON public.administrative_occurrences FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh')
);

-- Protocol generation function for Admin Occurrences
CREATE OR REPLACE FUNCTION public.generate_admin_protocol_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  protocol TEXT;
BEGIN
  -- Get today's date
  today_date := to_char(now(), 'YYYYMMDD');
  
  -- Get next sequence number for today from administrative_occurrences
  -- Protocol format: ADM-YYYYMMDD-SEQ
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
  protocol := 'ADM-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN protocol;
END;
$$;

-- Trigger to set protocol on insert
CREATE OR REPLACE FUNCTION public.set_admin_protocol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.protocol IS NULL THEN
    NEW.protocol := public.generate_admin_protocol_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_admin_protocol_trigger ON public.administrative_occurrences;
CREATE TRIGGER set_admin_protocol_trigger
BEFORE INSERT ON public.administrative_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_protocol();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_admin_occ ON public.administrative_occurrences;
CREATE TRIGGER handle_updated_at_admin_occ
BEFORE UPDATE ON public.administrative_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
