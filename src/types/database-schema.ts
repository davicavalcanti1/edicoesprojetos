export type AppRole = 'admin' | 'medico' | 'rh' | 'enfermagem' | 'estoque' | 'recepcao' | 'user';

export type TicketStatus = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';

export interface BaseRecord {
    id: string;
    protoco: string;
    created_at: string;
    updated_at: string;
    tenant_id: string;
}

export interface ArCondicionadoChamado {
    id: string;
    protocolo: string;
    localizacao: string;
    descricao: string;
    modelo?: string;
    numero_serie?: string;
    tag_equipamento?: string;
    status: TicketStatus;
    prioridade: string;
    criado_por?: string;
    criado_em: string;
}

export interface DispenserChamado {
    id: string;
    protocolo: string;
    localizacao: string;
    tipo_insumo?: string;
    problema?: string;
    status: TicketStatus;
    criado_por?: string;
    criado_em: string;
}

export interface BanheiroChamado {
    id: string;
    protocolo: string;
    localizacao: string;
    problema?: string;
    observacao?: string;
    status: TicketStatus;
    criado_em: string;
}

export interface OcorrenciaAdm {
    id: string;
    protocolo: string;
    titulo: string;
    descricao: string;
    categoria?: string;
    status: 'pendente' | 'em_analise' | 'concluido';
    prioridade: string;
    criado_por: string;
    atribuido_a?: string;
    criado_em: string;
}

export interface OcorrenciaEnf {
    id: string;
    protocolo: string;
    paciente_nome?: string;
    paciente_prontuario?: string;
    data_incidente?: string;
    tipo_incidente: string;
    descricao_detalhada: string;
    conduta_tomada?: string;
    dados_clinicos?: Record<string, any>;
    status: 'registrada' | 'analise_tecnica' | 'concluida';
    criado_por: string;
    criado_em: string;
}

export interface OcorrenciaLaudo {
    id: string;
    protocolo: string;
    paciente_nome: string;
    exame_tipo: string;
    data_exame?: string;
    accession_number?: string;
    motivo_revisao: string;
    prioridade: string;
    medico_solicitante?: string;
    medico_responsavel?: string;
    descricao_solicitacao: string;
    resposta_radiologista?: string;
    status: 'pendente' | 'em_revisao' | 'corrigido' | 'mantido' | 'cancelado';
    criado_por: string;
    public_token?: string;
    criado_em: string;
}
