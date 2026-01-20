-- Create a dedicated table for patient occurrences
-- This avoids conflicts with the main occurrences table (e.g. created_by, strict types)

CREATE TABLE IF NOT EXISTS public.patient_occurrences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID, -- Optional, for record keeping
    protocol TEXT NOT NULL,
    patient_name TEXT,
    patient_phone TEXT,
    patient_birth_date DATE,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'pendente', -- pendente, analisada, descartada
    
    -- Metadata
    user_agent TEXT,
    ip_address TEXT
);

-- Grant permissions
GRANT SELECT, INSERT ON public.patient_occurrences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_occurrences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_occurrences TO service_role;

-- RLS
ALTER TABLE public.patient_occurrences ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert
CREATE POLICY "Anon insert patient occurrences" ON public.patient_occurrences
    FOR INSERT WITH CHECK (true);

-- Allow authenticated (admin/staff) to view/manage
CREATE POLICY "Staff view all patient occurrences" ON public.patient_occurrences
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff update patient occurrences" ON public.patient_occurrences
    FOR UPDATE USING (auth.role() = 'authenticated');
