-- Remove the ALTER TABLE command which causes permission errors
-- RLS is enabled by default on storage.objects

-- 1. Ensure public/anon can read occurrences that have a token (Prerequisite for the storage policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'occurrences' 
    AND policyname = 'Public view by token'
  ) THEN
    CREATE POLICY "Public view by token" ON public.occurrences
    FOR SELECT
    TO public
    USING (public_token IS NOT NULL);
  END IF;
END $$;

-- 2. Create Storage Policy allows public/anon to download files if tied to a valid occurrence
-- Note: This assumes files are stored as "{occurrenceId}/{filename}"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access via Token'
    ) THEN
        CREATE POLICY "Public Access via Token" ON storage.objects
        FOR SELECT
        TO public
        USING (
            bucket_id = 'occurrence-attachments'
            AND (
                EXISTS (
                    SELECT 1 FROM public.occurrences o
                    WHERE o.id::text = split_part(name, '/', 1) -- 'name' column in storage.objects contains the path
                    AND o.public_token IS NOT NULL
                    AND o.subtipo = 'revisao_exame'::public.occurrence_subtype
                )
            )
        );
    END IF;
END $$;
