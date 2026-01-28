-- Atualizar todas as tabelas para garantir que registros antigos tenham o tenant_id padrão
UPDATE public.ocorrencias_laudo SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.ocorrencias_adm SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.ocorrencias_enf SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.ocorrencia_paciente SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.ocorrencia_livre SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
