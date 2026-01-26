-- Drop unused old attachment tables
DROP TABLE IF EXISTS public.occurrence_attachments CASCADE;
DROP TABLE IF EXISTS public.attachments_generico CASCADE;

-- Create generate_daily_protocol as a backup for any legacy client code
-- This uses a sequence table to ensure uniqueness if called
CREATE TABLE IF NOT EXISTS public.protocol_sequences (
    date_key DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    current_val INTEGER DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.generate_daily_protocol()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    seq_val INTEGER;
    formatted_date TEXT;
BEGIN
    formatted_date := to_char(today, 'YYYYMMDD');
    
    INSERT INTO public.protocol_sequences (date_key, current_val)
    VALUES (today, 1)
    ON CONFLICT (date_key)
    DO UPDATE SET current_val = protocol_sequences.current_val + 1
    RETURNING current_val INTO seq_val;
    
    RETURN formatted_date || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$;
