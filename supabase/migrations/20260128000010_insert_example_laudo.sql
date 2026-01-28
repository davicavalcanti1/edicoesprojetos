ALTER TABLE public.ocorrencia_laudo ADD COLUMN paciente_sexo TEXT;

-- Inserção de Ocorrência de Exemplo
INSERT INTO public.ocorrencia_laudo (
    criado_por,
    status,
    paciente_nome,
    paciente_telefone,
    paciente_sexo,
    paciente_data_nascimento,
    exame_tipo,
    exame_regiao,
    exame_data,
    exame_unidade,
    medico_responsavel_laudo,
    laudo_entregue,
    motivo_revisao,
    tipo_discrepancia,
    acao_tomada,
    pessoas_comunicadas,
    triagem_nivel,
    triagem_realizada_em,
    criado_em,
    public_token,
    medico_revisor_nome,
    mensagem_envio_medico,
    data_envio_medico,
    finalizada_em
) VALUES (
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu UUID
    'concluida',
    'LUIZ AGOSTINHO FALCAO',
    'NÃO CONSTA',
    'Masculino', -- Assumindo masculino pelo nome, verifique se está correto
    '1952-04-29',
    'DENSITOMETRIA',
    NULL,
    '2025-12-12',
    'INTEGRAÇÃO',
    'RAFAEL BORGES TAVARES CAVALCANTI',
    true, -- LAUDO ENTREGUE: SIM
    'PEDIDO MÉDICO',
    'DESCRITO EM ENCAMINHAMENTO MÉDICO EM ANEXO.',
    NULL,
    'DR. RAFAEL BORGES - MÉDICO EXECUTOR',
    3, -- INCIDENTE SEM DANO corresponde ao nível 3
    '2026-01-14 19:59:25-03:00',
    '2026-01-14 19:17:05-03:00',
    'e1a95ebd84754e5eec808445adf0fb5fe3e4390f3fe928cd0fa9ed8e6b2a8538',
    'DR RAFAEL BORGES TAVARES CAVALCANTI', -- MÉDICO DESTINO
    'Recebemos essa solicitação de revisão, poderia verificar? as informações constam no documento em anexo enviado pelo medico solicitante.',
    '2026-01-14 20:52:22-03:00',
    '2026-01-15 12:00:00' -- Data fictícia de finalização já que só foi dito "FINALIZADA EM 15/01"
);
