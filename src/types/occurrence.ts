import { AppRole } from "./database-schema";

export type OccurrenceType = "administrativa" | "revisao_exame" | "enfermagem" | "paciente" | "livre" | "medica" | "tecnica" | "assistencial";

export type OccurrenceSubtype = string;

export type OccurrenceStatus =
  | "registrada"
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

// Unified UI Interface
export interface Occurrence {
  id: string;
  protocolo: string;
  tenantId: string;
  tipo: OccurrenceType;
  subtipo: OccurrenceSubtype;

  // Status & Triage
  status: OccurrenceStatus;
  triagem?: TriageClassification;
  triagemPor?: string;
  triagemEm?: string;

  // Details
  descricaoDetalhada: string;
  acaoImediata?: string;
  impactoPercebido?: string;
  pessoasEnvolvidas?: string;
  contemDadoSensivel?: boolean;
  dadosEspecificos?: Record<string, any>;

  // Patient
  paciente?: {
    nomeCompleto?: string;
    idPaciente?: string;
    dataNascimento?: string;
    telefone?: string;
    tipoExame?: string;
    unidadeLocal?: string;
    dataHoraEvento?: string;
    sexo?: string;
  };

  // Outcome
  desfecho?: OccurrenceOutcome;
  desfecho_tipos?: OutcomeType[];
  desfecho_justificativa?: string;
  desfecho_principal?: OutcomeType;
  desfecho_definido_por?: string;
  desfecho_definido_em?: string;


  // Meta
  criadoPor: string;
  criadorNome?: string;
  criadoEm: string;
  atualizadoEm: string;

  // Legacy / Mapped fields for UI compat
  [key: string]: any;
}

export interface DbOccurrence extends Occurrence {
  // Database specific fields if needed
}

// ==============================================================================
// CONFIGS
// ==============================================================================

export const statusConfig: Record<OccurrenceStatus, { label: string; description?: string; color: string; bgColor: string }> = {
  registrada: { label: "Registrada", description: "Ocorrência registrada e aguardando triagem.", color: "text-blue-700", bgColor: "bg-blue-50" },
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
