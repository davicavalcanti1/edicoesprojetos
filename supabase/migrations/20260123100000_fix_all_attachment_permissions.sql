-- 1. Ensure RLS is enabled
ALTER TABLE public.occurrence_attachments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh (optional, but effectively ensures we don't have conflicts)
-- We will just use 'IF NOT EXISTS' to be safe and additive.

-- 3. Policy for Authenticated Users on DB Table
-- Allow all authenticated users to view attachments (Tenant isolation logic can be added later if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'occurrence_attachments' 
    AND policyname = 'Authenticated users can view attachments'
  ) THEN
    CREATE POLICY "Authenticated users can view attachments" ON public.occurrence_attachments
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'occurrence_attachments' 
    AND policyname = 'Authenticated users can manage attachments'
  ) THEN
    CREATE POLICY "Authenticated users can manage attachments" ON public.occurrence_attachments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;


-- 4. Policy for Authenticated Users on Storage
-- Allow authed users to do everything in the bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users full access'
    ) THEN
        CREATE POLICY "Authenticated users full access" ON storage.objects
        FOR ALL
        TO authenticated
        USING (bucket_id = 'occurrence-attachments')
        WITH CHECK (bucket_id = 'occurrence-attachments');
    END IF;
END $$;
