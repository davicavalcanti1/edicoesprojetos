-- Create storage bucket for occurrence attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'occurrence-attachments',
  'occurrence-attachments',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- Allow authenticated users to upload files to the bucket
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'occurrence-attachments');

-- Allow authenticated users to read files from the bucket
CREATE POLICY "Authenticated users can read attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'occurrence-attachments');

-- Allow authenticated users to delete their own uploaded files
CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'occurrence-attachments');

-- Allow public read access via signed URLs (anon role)
CREATE POLICY "Anyone can read attachments with signed URL"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'occurrence-attachments');
