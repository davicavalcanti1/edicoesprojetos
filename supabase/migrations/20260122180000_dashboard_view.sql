
-- View para facilitar Dashboard e Relatórios de Chamados (Banheiro/Dispenser)
create or replace view operacional_chamados_view as
select
    o.id,
    o.protocolo,
    o.criado_em as data_abertura,
    o.finalizado_em as data_fechamento,
    o.status,
    -- Extrair Tipo (Banheiro ou Dispenser)
    coalesce(o.dados_especificos->>'tipo', 'Outro') as tipo_chamado,
    -- Extrair Localização
    coalesce(o.dados_especificos->>'localizacao', 'Não identificado') as localizacao,
    -- Extrair Problema
    coalesce(o.dados_especificos->>'problema', o.dados_especificos->>'situacao', 'Não informado') as problema,
    -- Extrair Descrição
    o.descricao_detalhada,
    -- Extrair Observações (prioridade coluna, depois json)
    coalesce(o.observacoes, o.dados_especificos->>'observacoes') as observacoes_fechamento,
    -- Extrair quem finalizou (parse simples de acao_imediata se começar com "Finalizado por: ")
    case 
        when o.acao_imediata ilike 'Finalizado por:%' then substring(o.acao_imediata from 16)
        else o.acao_imediata
    end as finalizado_por,
    -- Calculo tempo resolução em horas (float)
    case 
        when o.finalizado_em is not null then 
            round(cast(extract(epoch from (o.finalizado_em - o.criado_em))/3600 as numeric), 2)
        else null
    end as tempo_resolucao_horas
from occurrences o
where 
    -- Filtrar apenas chamados operacionais de QR Code que tenham dados_especificos com tipo banheiro ou dispenser
    (o.dados_especificos->>'tipo') in ('banheiro', 'dispenser');

-- Dar permissão de leitura para roles autenticadas
grant select on operacional_chamados_view to authenticated;
