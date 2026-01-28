-- Inserção da Ocorrência GIVANILDO JOSÉ COSTA
INSERT INTO public.ocorrencia_laudo (
    id,
    criado_por,
    protocolo,
    status,
    -- Paciente
    paciente_nome,
    paciente_id, -- Prontuário
    paciente_telefone,
    paciente_sexo,
    paciente_data_nascimento,
    -- Exame
    exame_tipo,
    exame_regiao,
    exame_data,
    exame_unidade,
    medico_responsavel_laudo,
    medico_responsavel_laudo_id,
    laudo_entregue,
    -- Detalhes da Revisão
    motivo_revisao,
    tipo_discrepancia,
    acao_tomada,
    pessoas_comunicadas,
    -- Triagem
    triagem_nivel,
    triagem_realizada_em,
    triagem_realizada_por,
    -- Workflow
    public_token,
    criado_em,
    atualizado_em
) VALUES (
    'ab932031-90c7-469c-8479-db791c092305', -- ID
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu User ID
    '2026000005',
    'aguardando_medico',
    'GIVANILDO JOSÉ COSTA',
    '788142',
    '(83) 99919-6865',
    'Masculino',
    '1961-07-11',
    'Tomografia',
    'Tórax',
    '2025-12-30',
    'Integração',
    'Dr. Arthur José Ventura da Nóbrega',
    'dr_arthur_jose',
    true,
    'Pedido Médico',
    'MEDICO SOLICITA LAUDO COMPARATIVO EM RELACAO A EXAME DO DIA 19/08/25 REALIZADO AQUI NA IMAGO', -- Descrição/Discrepância
    'MEDICO SOLICITA LAUDO COMPARATIVO EM RELACAO A EXAME DO DIA 19/08/25 REALIZADO AQUI NA IMAGO', -- Ação Tomada (parece repetido no dump)
    'Stella Souto- Coordenação',
    3, -- incidente_sem_dano (Nível 3)
    '2026-01-20 23:02:14.359+00',
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu User ID na triagem também
    'd69a6f8e-162c-4140-87ec-fa6385410ec0',
    '2026-01-20 22:57:45.673+00',
    '2026-01-23 14:43:19.07+00'
)
ON CONFLICT (id) DO NOTHING;
