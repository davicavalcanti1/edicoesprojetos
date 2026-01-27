
-- Drop legacy occurrences table and related attachments table
-- This table is being replaced by separated tables: ocorrencias_adm, ocorrencias_enf, ocorrencias_laudo

DROP TABLE IF EXISTS "public"."occurrence_attachments" CASCADE;
DROP TABLE IF EXISTS "public"."occurrences" CASCADE;
