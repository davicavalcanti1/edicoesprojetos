-- Inserção da Ocorrência ANTONIO FAGNE FORMIGA DA SILVA
INSERT INTO public.ocorrencia_laudo (
    id,
    criado_por,
    protocolo,
    status,
    -- Paciente
    paciente_nome,
    paciente_id, -- Prontuário
    paciente_data_nascimento,
    paciente_sexo,
    -- Exame
    exame_tipo,
    exame_regiao,
    exame_data,
    exame_unidade,
    medico_responsavel_laudo,
    laudo_entregue,
    -- Detalhes da Revisão
    motivo_revisao,
    tipo_discrepancia,
    -- Triagem
    triagem_nivel,
    triagem_realizada_em,
    triagem_realizada_por,
    -- Médico Revisor
    medico_revisor_nome,
    mensagem_envio_medico,
    data_envio_medico,
    public_token,
    -- Desfecho
    desfecho_tipo,
    desfecho_observacao,
    finalizada_em,
    finalizada_por,
    criado_em,
    atualizado_em
) VALUES (
    'd1fbc400-80a5-4876-afc6-42c4a6b45459', -- ID fornecido
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu User ID (para garantir acesso)
    'IMAGO-20260115-0001',
    'concluida',
    'ANTONIO FAGNE FORMIGA DA SILVA',
    '673083',
    '1990-01-20',
    'Masculino',
    'Tomografia',
    'Tórax',
    '2026-01-12',
    'Integração',
    'Dr. Raiff Ramalho Cavalcanti',
    true,
    'Erro Identificado',
    'Paciente pediu para verificar a seguinte frase que consta no laudo - Elementos ósseos lesões de caráter agressivo',
    3, -- incidente_sem_dano (Nível 3)
    '2026-01-15 12:21:23.225+00',
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu User ID
    'Dr. Raiff Ramalho Cavalcanti',
    'Bom dia! Recebemos essa solicitação de reavaliação, poderia verificar?',
    '2026-01-15 12:21:45.533+00',
    '69a58eb7942a14b169668e1a2e84af8e6fbc209fea891d95cd31212763a9fb40',
    'imediato_correcao',
    'erro de digitação, substituição da frase de lesoes ósseas agressivas.',
    '2026-01-15 21:27:17.686+00',
    '8c6b9345-7b0e-4d79-aa2a-6ed9706cbadd', -- Seu User ID
    '2026-01-15 09:18:00+00',
    '2026-01-15 21:27:17.941+00'
)
ON CONFLICT (id) DO NOTHING; -- Evita erro se rodar duplicado
