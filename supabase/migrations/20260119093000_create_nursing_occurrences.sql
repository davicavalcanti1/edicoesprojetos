-- Create table for Nursing Occurrences
CREATE TABLE IF NOT EXISTS public.nursing_occurrences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    protocol text UNIQUE,
    -- Patient Data (Nursing-specific)
    patient_name text NOT NULL,
    patient_id text, -- MRN or CPF
    patient_birth_date date,
    
    occurrence_date timestamptz NOT NULL, -- Date/Time of the event
    
    type text NOT NULL DEFAULT 'enfermagem',
    subtype text NOT NULL, -- 'extravasamento_enfermagem', 'reacoes_adversas'
    
    description text NOT NULL,
    conduct text, -- "Conduta"
    
    status text DEFAULT 'registrada' NOT NULL, -- Using existing statuses or simplified? 'aberto', 'em_analise', 'concluido'
    triage text, -- 'verde', 'amarelo', 'vermelho' or custom classification
    
    specific_data jsonb DEFAULT '{}'::jsonb, -- Store subtype specific fields here
    attachments jsonb DEFAULT '[]'::jsonb,
    
    created_by uuid NOT NULL REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.nursing_occurrences ENABLE ROW LEVEL SECURITY;

-- Policies for Nursing Occurrences
-- Admin, RH, and Nursing (user role?) can VIEW
CREATE POLICY "Authorized users can view nursing occurrences"
ON public.nursing_occurrences FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh') OR
  public.has_role(auth.uid(), 'user') -- Assuming 'user' includes nurses for now
);

-- Authorized users can INSERT
CREATE POLICY "Authorized users can insert nursing occurrences"
ON public.nursing_occurrences FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh') OR
  public.has_role(auth.uid(), 'user')
);

-- Authorized users can UPDATE
CREATE POLICY "Authorized users can update nursing occurrences"
ON public.nursing_occurrences FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh') OR
  public.has_role(auth.uid(), 'user')
);

-- Protocol generation for Nursing Occurrences (ENF-YYYYMMDD-SEQ)
CREATE OR REPLACE FUNCTION public.generate_nursing_protocol_number(p_tenant_id uuid)
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
  
  -- Get next sequence number for today from nursing_occurrences
  SELECT COALESCE(MAX(
    NULLIF(
      regexp_replace(protocol, '.*-(\d+)$', '\1'),
      protocol
    )::INTEGER
  ), 0) + 1
  INTO sequence_num
  FROM public.nursing_occurrences
  WHERE tenant_id = p_tenant_id
  AND protocol LIKE 'ENF-' || today_date || '-%';
  
  -- Generate protocol: ENF-YYYYMMDD-SEQ
  protocol := 'ENF-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN protocol;
END;
$$;

-- Trigger to set protocol on insert
CREATE OR REPLACE FUNCTION public.set_nursing_protocol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.protocol IS NULL THEN
    NEW.protocol := public.generate_nursing_protocol_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_nursing_protocol_trigger ON public.nursing_occurrences;
CREATE TRIGGER set_nursing_protocol_trigger
BEFORE INSERT ON public.nursing_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.set_nursing_protocol();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_nursing_occ ON public.nursing_occurrences;
CREATE TRIGGER handle_updated_at_nursing_occ
BEFORE UPDATE ON public.nursing_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
