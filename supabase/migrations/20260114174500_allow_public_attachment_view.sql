-- Allow public select access to occurrence_attachments if the associated occurrence has a valid public_token and is for doctor review
CREATE POLICY "Public can view attachments by valid token" ON public.occurrence_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.occurrences o
    WHERE o.id = occurrence_attachments.occurrence_id
    AND o.public_token IS NOT NULL
    AND o.subtipo = 'revisao_exame'::public.occurrence_subtype
  )
);
