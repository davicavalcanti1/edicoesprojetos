-- Create the storage bucket for occurrence requirements if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('occurrence-reports', 'occurrence-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'occurrence-reports' );

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'occurrence-reports' );

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'occurrence-reports' );
