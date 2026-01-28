-- Inserção de Ocorrência "Bagunçada" (Mesmo paciente, dados inconsistentes)
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
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd',
    'concluida', -- Status mantido
    'luiz agostinho falcao', -- Nome em minúsculas
    NULL, -- Telefone faltando
    'M', -- Sexo abreviado
    '1952-04-29',
    'densitometria', -- Tipo exame minúsculo
    NULL, -- Região vazia
    '2025-12-12', 
    'integracao', -- Unidade sem acento e minúscula
    'Dr. Rafael', -- Nome do médico incompleto
    true, 
    'pedido medico', -- Sem acento
    'ver anexo', -- Descrição preguiçosa
    NULL,
    'Rafael', -- Pessoas comunicadas incompleto
    3, 
    '2026-01-14 20:05:00-03:00', -- Horário levemente diferente
    '2026-01-14 19:22:00-03:00',
    'ab932031-4829-4c5e-8822-45d278911234', -- Token baseado na imagem/novo
    'DR RAFAEL BORGES', -- Nome médico revisor diferente/incompleto
    'favor verificar', -- Mensagem curta/preguiçosa
    '2026-01-14 21:00:00-03:00',
    '2026-01-15 12:30:00'
);
