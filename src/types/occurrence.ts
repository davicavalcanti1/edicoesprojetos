import { AppRole } from "./database-schema";

export type OccurrenceType = "administrativa" | "revisao_exame" | "enfermagem" | "paciente" | "livre" | "medica" | "tecnica" | "assistencial";

export type OccurrenceSubtype = string;

export type OccurrenceStatus =
  | "registrada"
  | "aguardando_envio" // New initial state for Revisao Laudo
  | "aguardando_medico" // Sent to doctor
  | "aguardando_triagem" // Doctor finished, waiting admin
  | "em_triagem"
  | "em_analise"
  | "acao_em_andamento"
  | "concluida"
  | "improcedente"
  | "pendente" // Adm/Laudo legacy
  | "em_revisao" // Laudo
  | "corrigido" // Laudo
  | "mantido" // Laudo
  | "cancelado" // Laudo
  | "analise_tecnica"; // Enf

export type TriageClassification =
  | "circunstancia_risco"
  | "near_miss"
  | "incidente_sem_dano"
  | "evento_adverso"
  | "evento_sentinela";

export type OutcomeType =
  | "imediato_correcao"
  | "orientacao"
  | "treinamento"
  | "alteracao_processo"
  | "manutencao_corretiva"
  | "notificacao_externa"
  | "improcedente";

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: AppRole;
  avatar_url?: string;
}

export interface ExternalNotification {
  orgaoNotificado: string;
  data: string;
  responsavel: string;
}

export interface CAPA {
  acao: string;
  responsavel: string;
  prazo: string;
  status: "pendente" | "em_andamento" | "concluida";
}

export interface OccurrenceOutcome {
  tipos: OutcomeType[];
  justificativa?: string;
  desfechoPrincipal?: OutcomeType;
  definidoPor?: string;
  definidoEm?: string;
}

// ==============================================================================
// DATABASE MODELS (Reflecting specific table structures)
// ==============================================================================

export interface BaseOccurrence {
  id: string;
  protocolo: string;
  tenant_id: string;
  criado_por?: string;
  criado_em: string;
  atualizado_em: string;
  original_table?: string; // Helper for frontend logic
}

export interface OcorrenciaAdm extends BaseOccurrence {
  tipo: "administrativa"; // Fixed 'administrativa'
  subtipo?: string;
  status: OccurrenceStatus;

  // Base fields
  titulo?: string;
  descricao_detalhada?: string;
  prioridade?: string;
  atribuido_a?: string;

  // Snapshot Paciente (Less strict)
  paciente_nome?: string;
  paciente_cpf?: string;
  paciente_telefone?: string;
  paciente_data_nascimento?: string;

  // Signatures
  assinatura_responsavel_url?: string;
  assinatura_testemunha_url?: string;
  assinatura_envolvido_url?: string;

  dados_adicionais?: Record<string, any>;
}

export interface OcorrenciaLaudo extends BaseOccurrence {
  tipo: "revisao_exame" | "assistencial"; // 'assistencial' is legacy alias
  subtipo?: string;
  status: OccurrenceStatus; // default: aguardando_envio

  // Paciente
  paciente_nome: string;
  paciente_cpf?: string;
  paciente_data_nascimento?: string;
  paciente_telefone?: string;

  // Exame
  exame_tipo: string;
  exame_regiao?: string;
  exame_data?: string;
  exame_unidade?: string;

  medico_responsavel_laudo?: string;
  medico_responsavel_laudo_id?: string;
  laudo_entregue?: boolean;

  // Review
  motivo_revisao: string;
  motivo_revisao_outro?: string;
  tipo_discrepancia?: string;

  // Actions
  acao_tomada?: string;
  pessoas_comunicadas?: string;

  dados_adicionais?: Record<string, any>;

  // Medical Flow
  triagem_nivel?: number;
  triagem_observacao?: string;
  medico_revisor_nome?: string;
  medico_revisor_id?: string;
  public_token?: string;

  // Outcome
  desfecho_tipo?: string;
  desfecho_observacao?: string;
}

export interface OcorrenciaEnf extends BaseOccurrence {
  tipo: "enfermagem";
  subtipo: "extravasamento_enfermagem" | "reacoes_adversas";
  status: OccurrenceStatus;

  // Paciente
  paciente_nome: string;
  paciente_cpf?: string;
  paciente_data_nascimento?: string;
  paciente_telefone?: string;
  paciente_tipo_exame?: string;
  paciente_unidade_local?: string;
  paciente_data_hora_evento?: string;

  // Details
  medico_avaliou?: string;
  conduta?: string;
  volume_injetado_ml?: string;
  calibre_acesso?: string;
  fez_rx?: boolean;
  teve_compressa?: boolean;
  contraste_utilizado?: string;
  validade_lote?: string;

  responsavel_auxiliar_enf?: string;
  responsavel_tecnico_raio_x?: string;
  responsavel_coordenador?: string;

  dados_adicionais?: Record<string, any>;
}

// Union Type used by UI components
export type AnyOccurrence = OcorrenciaAdm | OcorrenciaLaudo | OcorrenciaEnf | (BaseOccurrence & { tipo: string;[key: string]: any });

// Deprecated UI Interface (Used only for legacy compatibility during migration)
export interface Occurrence extends BaseOccurrence {
  tipo: any;
  subtipo: any;
  status: any;
  [key: string]: any;
}

// ==============================================================================
// CONFIGS
// ==============================================================================

export const statusConfig: Record<OccurrenceStatus, { label: string; description?: string; color: string; bgColor: string }> = {
  registrada: { label: "Registrada", description: "Ocorrência registrada e aguardando triagem.", color: "text-blue-700", bgColor: "bg-blue-50" },
  aguardando_envio: { label: "Aguardando Envio", description: "Aguardando envio para o médico.", color: "text-slate-700", bgColor: "bg-slate-100" },
  aguardando_medico: { label: "Aguardando Médico", description: "Enviado para análise médica.", color: "text-indigo-700", bgColor: "bg-indigo-50" },
  aguardando_triagem: { label: "Aguardando Triagem", description: "Análise médica concluída, aguardando triagem.", color: "text-amber-700", bgColor: "bg-amber-50" },
  pendente: { label: "Pendente", color: "text-blue-700", bgColor: "bg-blue-50" }, // Alias for registrada
  em_triagem: { label: "Em Triagem", description: "Ocorrência em processo de triagem.", color: "text-yellow-700", bgColor: "bg-yellow-50" },
  em_analise: { label: "Em Análise", description: "Ocorrência em análise detalhada.", color: "text-purple-700", bgColor: "bg-purple-50" },
  analise_tecnica: { label: "Análise Técnica", color: "text-purple-700", bgColor: "bg-purple-50" },
  em_revisao: { label: "Em Revisão", color: "text-purple-700", bgColor: "bg-purple-50" },
  acao_em_andamento: { label: "Ação em Andamento", description: "Ações sendo executadas.", color: "text-orange-700", bgColor: "bg-orange-50" },
  concluida: { label: "Concluída", description: "Ocorrência finalizada.", color: "text-green-700", bgColor: "bg-green-50" },
  corrigido: { label: "Corrigido", color: "text-green-700", bgColor: "bg-green-50" },
  mantido: { label: "Mantido", color: "text-gray-700", bgColor: "bg-gray-50" },
  improcedente: { label: "Improcedente", description: "Ocorrência considerada improcedente.", color: "text-gray-700", bgColor: "bg-gray-100" },
  cancelado: { label: "Cancelado", color: "text-red-700", bgColor: "bg-red-50" },
};

export const statusTransitions: Record<OccurrenceStatus, OccurrenceStatus[]> = {
  registrada: ["em_triagem", "improcedente"],
  aguardando_envio: ["aguardando_medico", "improcedente"],
  aguardando_medico: ["aguardando_triagem"],
  aguardando_triagem: ["concluida", "improcedente"],
  em_triagem: ["em_analise", "improcedente"],
  em_analise: ["acao_em_andamento", "concluida", "improcedente"],
  acao_em_andamento: ["concluida"],
  concluida: [], // Terminal state
  improcedente: [], // Terminal state
  pendente: ["em_revisao", "cancelado"],
  em_revisao: ["corrigido", "mantido"],
  corrigido: [],
  mantido: [],
  cancelado: [],
  analise_tecnica: ["concluida"]
};

export const triageConfig: Record<TriageClassification, { label: string; description: string; color: string; bgColor: string; level: number }> = {
  circunstancia_risco: {
    label: "Circunstância de Risco",
    description: "Potencial de causar dano ou erro.",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    level: 1,
  },
  near_miss: {
    label: "Near Miss",
    description: "Incidente que não atingiu o paciente.",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    level: 2,
  },
  incidente_sem_dano: {
    label: "Incidente sem Dano",
    description: "Atingiu o paciente mas não causou dano.",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    level: 3,
  },
  evento_adverso: {
    label: "Evento Adverso",
    description: "Incidente que resultou em dano ao paciente.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    level: 4,
  },
  evento_sentinela: {
    label: "Evento Sentinela",
    description: "Dano grave ou morte (Investigação obrigatória).",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    level: 5,
  },
};

export const outcomeConfig: Record<OutcomeType, { label: string; icon: string; description: string; requiresCapa?: boolean; requiresExternalNotification?: boolean }> = {
  imediato_correcao: {
    label: "Correção Imediata",
    icon: "zap",
    description: "O problema foi resolvido imediatamente.",
  },
  orientacao: {
    label: "Orientação",
    icon: "message-circle",
    description: "O colaborador foi orientado.",
  },
  treinamento: {
    label: "Treinamento",
    icon: "graduation-cap",
    description: "Necessidade de treinamento identificada.",
    requiresCapa: true,
  },
  alteracao_processo: {
    label: "Alteração de Processo",
    icon: "file-cog",
    description: "Mudança no fluxo de trabalho.",
    requiresCapa: true,
  },
  manutencao_corretiva: {
    label: "Manutenção Corretiva",
    icon: "wrench",
    description: "Reparo de equipamento ou estrutura.",
  },
  notificacao_externa: {
    label: "Notificação Externa",
    icon: "send",
    description: "Notificação a órgãos reguladores.",
    requiresExternalNotification: true,
  },
  improcedente: {
    label: "Improcedente",
    icon: "x-circle",
    description: "A ocorrência não procede.",
  },
};

export const requiresCapa = (outcomes: OutcomeType[]) => {
  return outcomes.some((o) => outcomeConfig[o]?.requiresCapa);
};

export const requiresExternalNotification = (outcomes: OutcomeType[]) => {
  return outcomes.some((o) => outcomeConfig[o]?.requiresExternalNotification);
};

export const typeLabels: Record<OccurrenceType, string> = {
  medica: "Médica",
  administrativa: "Administrativa",
  revisao_exame: "Revisão de Exame",
  enfermagem: "Enfermagem",
  paciente: "Paciente",
  livre: "Livre",
  tecnica: "Técnica",
  assistencial: "Assistencial" // Legacy
};

export const subtypesByType: Record<OccurrenceType, OccurrenceSubtype[]> = {
  administrativa: ["faturamento", "agendamento"],
  revisao_exame: ["revisao_exame"],
  enfermagem: ["extravasamento_enfermagem", "reacoes_adversas"],
  paciente: ["paciente_outros"],
  livre: ["livre_outros"],
  medica: [],
  tecnica: [],
  assistencial: []
};

// Add subtype labels for display
export const subtypeLabels: Record<string, string> = {
  revisao_exame: "Revisão de Exame",
  extravasamento_enfermagem: "Extravasamento (Enf)",
  reacoes_adversas: "Reações Adversas",
  faturamento: "Faturamento",
  agendamento: "Agendamento",
  paciente_outros: "Outros (Paciente)",
  livre_outros: "Outros (Livre)",
  // Add other legacy mappings if needed
};

// Add subtype descriptions
export const subtypeDescriptions: Record<string, string> = {
  revisao_exame: "Solicitar revisão de laudo ou imagem.",
  extravasamento_enfermagem: "Extravasamento de contraste ou medicação.",
  reacoes_adversas: "Reações adversas a medicamentos ou contrastes.",
  faturamento: "Erros ou dúvidas de faturamento.",
  agendamento: "Problemas com agendamento de exames.",
  paciente_outros: "Outras ocorrências relatadas pelo paciente.",
  livre_outros: "Outras ocorrências diversas.",
};

export interface OccurrenceFormData {
  dataHoraEvento: string;
  unidadeLocal?: string;
  paciente: {
    nomeCompleto: string;
    cpf?: string;
    telefone: string;
    idPaciente?: string;
    dataNascimento: string;
    sexo?: "Masculino" | "Feminino";
    tipoExame?: string;
  };
  tipo: OccurrenceType;
  subtipo: OccurrenceSubtype;
  dadosEspecificos: Record<string, any>;
}
