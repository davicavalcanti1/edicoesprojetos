-- Add origin column to occurrences table
ALTER TABLE public.occurrences
ADD COLUMN origin text DEFAULT 'web';

COMMENT ON COLUMN public.occurrences.origin IS 'Origin of the occurrence registration (e.g., web, whatsapp)';
