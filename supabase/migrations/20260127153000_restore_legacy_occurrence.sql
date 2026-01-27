
-- Insert legacy occurrence into ocorrencias_adm
INSERT INTO "public"."ocorrencias_adm" (
    "id", "tenant_id", "protocolo", "tipo", "subtipo", 
    "titulo", "descricao", "categoria", "status", 
    "criado_por", "criado_em", "atualizado_em", 
    "employee_name", "occurrence_date",
    "paciente_nome_completo", "paciente_telefone", "paciente_id", "paciente_data_nascimento", 
    "paciente_unidade_local", "paciente_data_hora_evento", 
    "descricao_detalhada", "acao_imediata", "pessoas_envolvidas", "contem_dado_sensivel",
    "triagem", "triagem_por", "triagem_em", 
    "desfecho_tipos", "desfecho_justificativa", "desfecho_definido_por", "desfecho_definido_em",
    "dados_especificos", 
    "public_token", "medico_destino", "mensagem_admin_medico", "mensagem_medico",
    "finalizada_em", "paciente-sexo"
) VALUES (
    '728d5922-614c-4c2f-b11a-3d85b8a8592b', -- id
    '864440c5-a22c-4bad-9c54-58865f445df4', -- tenant_id
    'IMAGO-20260116-0001', -- protocolo
    'assistencial', -- tipo
    'revisao_exame', -- subtipo
    'IMAGO-20260116-0001', -- titulo (using protocol)
    '{"exameModalidade":"Ressonância Magnética","exameRegiao":"Coluna Lombar","exameData":"2025-12-03","medicoResponsavelId":"dr_pericles_almeida","medicoResponsavel":"Dr. Péricles Almeida da Costa","laudoEntregue":"sim","motivoRevisao":"Pedido Médico","tipoDiscrepancia":"Descrito em pedido médico em anexo","acaoTomada":"Solicitação enviada ao médico executor","pessoasComunicadas":"Dr. Pericles Almeida"}', -- descricao
    'assistencial', -- categoria
    'concluida', -- status
    'c545a33c-4aa1-4f3c-b3cf-f9d8fea647f1', -- criado_por
    '2026-01-16 20:51:24.330209+00', -- criado_em
    '2026-01-19 20:00:21.244314+00', -- atualizado_em
    'ALESSANDRA DE SOUSA ARAUJO', -- employee_name
    '2026-01-16 17:48:00+00', -- occurrence_date
    'ALESSANDRA DE SOUSA ARAUJO', -- paciente_nome_completo
    'Não consta', -- paciente_telefone
    '0085115', -- paciente_id
    '1978-12-18', -- paciente_data_nascimento
    'Integração', -- paciente_unidade_local
    '2026-01-16 17:48:00+00', -- paciente_data_hora_evento
    '{"exameModalidade":"Ressonância Magnética","exameRegiao":"Coluna Lombar","exameData":"2025-12-03","medicoResponsavelId":"dr_pericles_almeida","medicoResponsavel":"Dr. Péricles Almeida da Costa","laudoEntregue":"sim","motivoRevisao":"Pedido Médico","tipoDiscrepancia":"Descrito em pedido médico em anexo","acaoTomada":"Solicitação enviada ao médico executor","pessoasComunicadas":"Dr. Pericles Almeida"}', -- descricao_detalhada
    null, -- acao_imediata
    '', -- pessoas_envolvidas
    false, -- contem_dado_sensivel
    'concluida', -- triagem
    'c545a33c-4aa1-4f3c-b3cf-f9d8fea647f1', -- triagem_por
    '2026-01-17 11:18:34.972+00', -- triagem_em
    ARRAY['imediato_correcao'], -- desfecho_tipos
    'Foi realizada retificação do laudo, que consta em nosso pacs', -- desfecho_justificativa
    'c545a33c-4aa1-4f3c-b3cf-f9d8fea647f1', -- desfecho_definido_por
    '2026-01-19 20:00:20.889+00', -- desfecho_definido_em
    '{"exameData": "2025-12-03", "acaoTomada": "Solicitação enviada ao médico executor", "exameRegiao": "Coluna Lombar", "laudoEntregue": "sim", "motivoRevisao": "Pedido Médico", "exameModalidade": "Ressonância Magnética", "tipoDiscrepancia": "Descrito em pedido médico em anexo", "medicoResponsavel": "Dr. Péricles Almeida da Costa", "pessoasComunicadas": "Dr. Pericles Almeida", "medicoResponsavelId": "dr_pericles_almeida"}', -- dados_especificos
    '7f9a17c37eb68ad8eec7daf0ac9c1a745093745e2b9feeab7c939698fa085606', -- public_token
    'Dr. Péricles Almeida da Costa', -- medico_destino
    'Recebemos essa solicitação de reavaliação, poderia verificar? ', -- mensagem_admin_medico
    null, -- mensagem_medico
    null, -- finalizada_em
    'Feminino' -- paciente-sexo
)
ON CONFLICT (id) DO UPDATE SET
    dados_especificos = EXCLUDED.dados_especificos,
    descricao = EXCLUDED.descricao,
    status = EXCLUDED.status,
    medico_destino = EXCLUDED.medico_destino,
    paciente_id = EXCLUDED.paciente_id,
    employee_name = EXCLUDED.employee_name;
