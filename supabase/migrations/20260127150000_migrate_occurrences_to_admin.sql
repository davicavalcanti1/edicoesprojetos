
-- Add missing columns to ocorrencias_adm
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "tipo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "subtipo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_nome_completo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_telefone" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_id" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_data_nascimento" date;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_tipo_exame" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_unidade_local" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_data_hora_evento" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "descricao_detalhada" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "acao_imediata" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "impacto_percebido" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "pessoas_envolvidas" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "contem_dado_sensivel" boolean;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triagem" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triagem_por" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triagem_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "desfecho_tipos" text[];
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "desfecho_justificativa" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "desfecho_principal" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "desfecho_definido_por" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "desfecho_definido_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "notificacao_orgao" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "notificacao_data" date;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "notificacao_responsavel" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "notificacao_anexo_url" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "atualizado_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "pdf_conclusao_url" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "pdf_gerado_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "dados_especificos" jsonb;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "registrador_setor" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "registrador_cargo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "houve_dano" boolean;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "descricao_dano" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "pessoas_comunicadas" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "observacoes" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "acoes_imediatas_checklist" jsonb;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "public_token" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medico_destino" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "mensagem_admin_medico" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "mensagem_medico" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "encaminhada_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "finalizada_em" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente-sexo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_sexo" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "custom_type" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "related_employee_id" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_analysis_status" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_analysis_completed_at" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_doctor_id" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_doctor_name" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_analysis_result" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "medical_analysis_note" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triage_classification" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triage_impact" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triage_recurrence" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triage_completed_at" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "triage_by_user_id" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "outcome_actions" text[];
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "outcome_note" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "outcome_completed_at" timestamptz;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "outcome_by_user_id" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "finalizado_por" uuid;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "origin" text;
ALTER TABLE "public"."ocorrencias_adm" ADD COLUMN IF NOT EXISTS "paciente_nome" text;

-- Transfer data from occurrences to ocorrencias_adm
INSERT INTO public.ocorrencias_adm (
  id, tenant_id, protocolo, descricao, criado_por, criado_em,
  employee_name, type, subtype, occurrence_date, status, titulo, categoria,
  tipo, subtipo, paciente_nome_completo, paciente_telefone, paciente_id,
  paciente_data_nascimento, paciente_tipo_exame, paciente_unidade_local,
  paciente_data_hora_evento, descricao_detalhada, acao_imediata,
  impacto_percebido, pessoas_envolvidas, contem_dado_sensivel, triagem,
  triagem_por, triagem_em, desfecho_tipos, desfecho_justificativa,
  desfecho_principal, desfecho_definido_por, desfecho_definido_em,
  notificacao_orgao, notificacao_data, notificacao_responsavel,
  notificacao_anexo_url, atualizado_em, pdf_conclusao_url, pdf_gerado_em,
  dados_especificos, registrador_setor, registrador_cargo, houve_dano,
  descricao_dano, pessoas_comunicadas, observacoes, acoes_imediatas_checklist,
  public_token, medico_destino, mensagem_admin_medico, mensagem_medico,
  encaminhada_em, finalizada_em, "paciente-sexo", paciente_sexo,
  custom_type, related_employee_id, medical_analysis_status,
  medical_analysis_completed_at, medical_doctor_id, medical_doctor_name,
  medical_analysis_result, medical_analysis_note, triage_classification,
  triage_impact, triage_recurrence, triage_completed_at, triage_by_user_id,
  outcome_actions, outcome_note, outcome_completed_at, outcome_by_user_id,
  finalizado_por, origin, paciente_nome
)
SELECT
  id, tenant_id, protocolo, descricao_detalhada, criado_por, criado_em,
  COALESCE(employee_name, paciente_nome_completo, 'Desconhecido'), tipo, subtipo, COALESCE(paciente_data_hora_evento, criado_em), status, protocolo, tipo,
  tipo, subtipo, paciente_nome_completo, paciente_telefone, paciente_id,
  paciente_data_nascimento, paciente_tipo_exame, paciente_unidade_local,
  paciente_data_hora_evento, descricao_detalhada, acao_imediata,
  impacto_percebido, pessoas_envolvidas, contem_dado_sensivel, triagem,
  triagem_por, triagem_em, desfecho_tipos, desfecho_justificativa,
  desfecho_principal, desfecho_definido_por, desfecho_definido_em,
  notificacao_orgao, notificacao_data, notificacao_responsavel,
  notificacao_anexo_url, atualizado_em, pdf_conclusao_url, pdf_gerado_em,
  dados_especificos, registrador_setor, registrador_cargo, houve_dano,
  descricao_dano, pessoas_comunicadas, observacoes, acoes_imediatas_checklist,
  public_token, medico_destino, mensagem_admin_medico, mensagem_medico,
  encaminhada_em, finalizada_em, "paciente-sexo", paciente_sexo,
  custom_type, related_employee_id, medical_analysis_status,
  medical_analysis_completed_at, medical_doctor_id, medical_doctor_name,
  medical_analysis_result, medical_analysis_note, triage_classification,
  triage_impact, triage_recurrence, triage_completed_at, triage_by_user_id,
  outcome_actions, outcome_note, outcome_completed_at, outcome_by_user_id,
  finalizado_por, origin, paciente_nome
FROM public.occurrences
WHERE tipo = 'assistencial'
ON CONFLICT (id) DO NOTHING;
