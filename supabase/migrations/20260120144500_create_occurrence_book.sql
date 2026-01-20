-- Enum values should be added in 20260120144400_prepare_enums.sql to avoid 55P04 error

-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Occurrence Book Entries Table
CREATE TABLE IF NOT EXISTS public.occurrence_book_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sector TEXT NOT NULL CHECK (sector IN ('administrativo', 'enfermagem')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id), -- Nullable for system inserts if needed, but usually required
    page_number INTEGER NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id)
);

-- Create a function to auto-assign page number per sector
CREATE OR REPLACE FUNCTION public.set_book_page_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(page_number), 0) + 1
    INTO NEW.page_number
    FROM public.occurrence_book_entries
    WHERE sector = NEW.sector;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign page number
DROP TRIGGER IF EXISTS trigger_set_book_page_number ON public.occurrence_book_entries;
CREATE TRIGGER trigger_set_book_page_number
BEFORE INSERT ON public.occurrence_book_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_book_page_number();

-- Enable RLS
ALTER TABLE public.occurrence_book_entries ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admin View All
CREATE POLICY "Admin view all books" ON public.occurrence_book_entries
    FOR SELECT USING (
        public.has_role('admin'::app_role, auth.uid())
    );

-- RH View Administrative
CREATE POLICY "RH view administrative" ON public.occurrence_book_entries
    FOR SELECT USING (
        sector = 'administrativo' AND
        (public.has_role('rh'::app_role, auth.uid()) OR public.has_role('admin'::app_role, auth.uid()))
    );

-- Enfermagem View Enfermagem
CREATE POLICY "Enfermagem view enfermagem" ON public.occurrence_book_entries
    FOR SELECT USING (
        sector = 'enfermagem' AND
        (public.has_role('enfermagem'::app_role, auth.uid()) OR public.has_role('admin'::app_role, auth.uid()))
    );

-- Insert policies
CREATE POLICY "RH insert administrative" ON public.occurrence_book_entries
    FOR INSERT WITH CHECK (
        sector = 'administrativo' AND
        public.has_role('rh'::app_role, auth.uid())
    );

CREATE POLICY "Enfermagem insert enfermagem" ON public.occurrence_book_entries
    FOR INSERT WITH CHECK (
        sector = 'enfermagem' AND
        public.has_role('enfermagem'::app_role, auth.uid())
    );
    
-- Allow admins to insert in both? Usually yes.
CREATE POLICY "Admin insert all" ON public.occurrence_book_entries
    FOR INSERT WITH CHECK (
        public.has_role('admin'::app_role, auth.uid())
    );

-- Update/Delete: "Nada pode ser alterado neste livro" -> No Update/Delete policies (default deny)

-- Policies for Patient Route (Anonymous Creation of Occurrences)
-- We need to allow anonymous users to insert into 'occurrences' table IF type is 'paciente'
-- Since strict RLS might block 'anon', we usually need a specific policy.
-- Assuming 'anon' role is used for public access.

CREATE POLICY "Public insert patient occurrences" ON public.occurrences
    FOR INSERT WITH CHECK (
        tipo = 'paciente' 
        -- And ideally we check if auth.role() = 'anon' or just allow it generally for this type
    );

-- Grant permissions to anon/authenticated for the new table if needed
GRANT SELECT, INSERT ON public.occurrence_book_entries TO authenticated;

