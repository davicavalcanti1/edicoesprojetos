// Occurrence Types and Subtypes
// "revisao_exame" is now a primary type along with "administrativa" and "enfermagem"
export type OccurrenceType = "administrativa" | "revisao_exame" | "enfermagem" | "paciente" | "simples" | "livre";

type AdministrativaSubtype =
  | "faturamento"
  | "agendamento";

type EnfermagemSubtype =
  | "extravasamento_enfermagem"
  | "reacoes_adversas";

export type OccurrenceSubtype =
  | AdministrativaSubtype
  | EnfermagemSubtype
  | "revisao_exame";

// Triage Classification (severity order: ascending)
export type TriageClassification =
  | "circunstancia_risco"
  | "near_miss"
  | "incidente_sem_dano"
  | "evento_adverso"
  | "evento_sentinela";

// Occurrence Status - Complete Flow
export type OccurrenceStatus =
  | "registrada"
  | "em_triagem"
  | "em_analise"
  | "acao_em_andamento"
  | "concluida"
  | "improcedente";

// Outcome Types (Desfechos)
export type OutcomeType =
  | "imediato_correcao"
  | "orientacao"
  | "treinamento"
  | "alteracao_processo"
  | "manutencao_corretiva"
  | "notificacao_externa"
  | "improcedente";

// External Notification Data
export interface ExternalNotification {
  orgaoNotificado: string;
  data: string;
  responsavel: string;
  anexoComprovante?: string;
  documentoGerado?: string;
}

// CAPA - Corrective and Preventive Action
export interface CAPA {
  id: string;
  causaRaiz: string;
  acao: string;
  responsavel: string;
  prazo: string;
  evidencia?: string;
  verificacaoEficacia?: string;
  verificadoPor?: string;
  verificadoEm?: string;
  status: "pendente" | "em_andamento" | "concluida" | "verificada";
}

// Outcome Record
export interface OccurrenceOutcome {
  tipos: OutcomeType[];
  justificativa: string;
  desfechoPrincipal?: OutcomeType;
  notificacaoExterna?: ExternalNotification;
  capas?: CAPA[];
  definidoPor: string;
  definidoEm: string;
}

// Patient Data Block
interface PatientData {
  nomeCompleto: string;
  cpf?: string;
  telefone?: string;
  idPaciente?: string;
  dataNascimento?: string;
  tipoExame?: string;
  unidadeLocal?: string;
  dataHoraEvento?: string;
  sexo?: "Masculino" | "Feminino";
}

// Registrador Data Block
interface RegistradorData {
  setor: string;
  cargo: string;
  medicoAvaliou?: string;
  auxiliarEnfermagem?: string;
  tecnicoRadiologia?: string;
  coordenadorResponsavel?: string;
}

// Pessoa Comunicada
interface PessoaComunicada {
  nome: string;
  cargo: string;
  dataHora: string;
}

// ============ DADOS ESPECÍFICOS POR SUBTIPO ============

// Extravasamento Enfermagem
interface ExtravasamentoEnfermagemData {
  volumeInjetadoMl?: string;
  fezRx?: boolean;
  compressa?: boolean;
  calibreAcesso?: string;
  conduta?: string;
  medicoAvaliou?: string;
  auxiliarEnfermagem?: string;
  tecnicoRadiologia?: string;
  coordenadorResponsavel?: string;
  anexos?: string[];
}

// Reacoes Adversas
interface ReacoesAdversasData {
  contrasteUtilizado?: string;
  validadeLote?: string;
  quantidadeInjetada?: string;
  conduta?: string;
  medicoAvaliou?: string;
  anexos?: string[];
}

// Revisão de Exame
export interface RevisaoExameData {
  exameModalidade: string;
  exameRegiao: string;
  exameData: string;
  motivoRevisao:
  | "pedido_medico"
  | "auditoria"
  | "duvida"
  | "segunda_leitura"
  | "reclamacao"
  | "outro";
  motivoOutro?: string;
  laudoEntregue: boolean;
  tipoDiscrepancia: string[];
  discrepanciaOutro?: string;
  potencialImpacto?: "nenhum" | "baixo" | "medio" | "alto";
  impactoDescricao?: string;
  acaoTomada: string[];
  acaoOutra?: string;
  pessoasComunicadas: {
    tipo: "radiologista" | "coordenacao" | "solicitante";
    nome: string;
  }[];
}

// Union de todos os dados específicos
export type DadosEspecificos =
  | RevisaoExameData
  | ExtravasamentoEnfermagemData
  | ReacoesAdversasData
  | Record<string, unknown>;

// ============ FORM DATA ============

// Base Form Data - Campos comuns a todos
interface BaseOccurrenceFormData {
  // Identificação do registrador
  registrador: RegistradorData;
  // Data e hora do evento
  dataHoraEvento: string;
  // Local
  unidadeLocal: string;
  // Dados do paciente
  paciente: PatientData;
  // Descrição objetiva
  descricaoDetalhada: string;
  // Ações imediatas
  acaoImediata: string;
  acoesImediatasChecklist: string[];
  // Dano/Lesão
  houveDano: boolean;
  descricaoDano?: string;
  // Comunicação
  pessoasComunicadas: PessoaComunicada[];
  // Anexos e observações
  anexos?: string[];
  observacoes?: string;
  contemDadoSensivel: boolean;
  pessoasEnvolvidas?: string;
  impactoPercebido?: string;
  medicoDestino?: string;
}

// Occurrence Form Data
export interface OccurrenceFormData extends BaseOccurrenceFormData {
  tipo: OccurrenceType;
  subtipo: OccurrenceSubtype;
  // Dados específicos do subtipo
  dadosEspecificos?: DadosEspecificos;
}

// Full Occurrence Record
export interface Occurrence extends OccurrenceFormData {
  id: string;
  protocolo: string;
  tenantId: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  status: OccurrenceStatus;
  triagem?: TriageClassification;
  triagemPor?: string;
  triagemEm?: string;
  desfecho?: OccurrenceOutcome;
  historicoStatus: StatusChange[];
  // Campos legados
  impactoPercebido?: string;
  pessoasEnvolvidas?: string;
  // Campos para acesso público
  publicToken?: string;
}

// Status Change History
interface StatusChange {
  de: OccurrenceStatus;
  para: OccurrenceStatus;
  por: string;
  em: string;
  motivo?: string;
}

// Subtype Labels
export const subtypeLabels: Record<OccurrenceSubtype, string> = {
  revisao_exame: "Revisão de exame",
  faturamento: "Faturamento",
  agendamento: "Agendamento",
  extravasamento_enfermagem: "Extravasamento de contraste",
  reacoes_adversas: "Reações adversas",
};

// Subtype Descriptions
export const subtypeDescriptions: Record<OccurrenceSubtype, string> = {
  revisao_exame: "Necessidade de revisão de laudo ou imagem após entrega",
  faturamento: "Problemas relacionados a cobranças, convênios ou pagamentos",
  agendamento: "Erros ou problemas no agendamento de exames",
  extravasamento_enfermagem: "Extravasamento de contraste ocorrido durante procedimento (Enfermagem)",
  reacoes_adversas: "Reação adversa ao meio de contraste ou medicação",
};

// Subtypes by Type (for wizard navigation)
export const subtypesByType: Record<OccurrenceType, OccurrenceSubtype[]> = {
  administrativa: [
    "faturamento",
    "agendamento",
  ],
  revisao_exame: ["revisao_exame"],
  enfermagem: ["extravasamento_enfermagem", "reacoes_adversas"],
  paciente: [],
  simples: [], // Generic text occurrence
};

// Triage Labels and Config
export const triageConfig: Record<
  TriageClassification,
  { label: string; description: string; color: string; priority: number }
> = {
  circunstancia_risco: {
    label: "Circunstância de risco",
    description: "Situação com potencial de causar dano",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    priority: 1,
  },
  near_miss: {
    label: "Near Miss",
    description: "Quase falha - interceptada antes de atingir o paciente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    priority: 2,
  },
  incidente_sem_dano: {
    label: "Incidente sem dano",
    description: "Evento ocorreu mas não causou dano ao paciente",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    priority: 3,
  },
  evento_adverso: {
    label: "Evento adverso",
    description: "Evento causou dano ao paciente",
    color: "bg-red-100 text-red-800 border-red-200",
    priority: 4,
  },
  evento_sentinela: {
    label: "Evento sentinela",
    description: "Evento grave, inesperado, com dano permanente ou óbito",
    color: "bg-red-200 text-red-900 border-red-300",
    priority: 5,
  },
};

// Status Labels and Config
export const statusConfig: Record<
  OccurrenceStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  registrada: {
    label: "Registrada",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    description: "Aguardando triagem inicial",
  },
  em_triagem: {
    label: "Em Triagem",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Classificação de gravidade em andamento",
  },
  em_analise: {
    label: "Em Análise",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Investigação e análise detalhada",
  },
  acao_em_andamento: {
    label: "Ação em Andamento",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Ações corretivas sendo executadas",
  },
  concluida: {
    label: "Concluída",
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Todas as ações finalizadas",
  },
  improcedente: {
    label: "Improcedente",
    color: "text-gray-500",
    bgColor: "bg-gray-200",
    description: "Ocorrência encerrada como improcedente",
  },
};

// Status Flow - Valid Transitions
export const statusTransitions: Record<OccurrenceStatus, OccurrenceStatus[]> = {
  registrada: ["em_triagem", "improcedente"],
  em_triagem: ["em_analise", "improcedente"],
  em_analise: ["acao_em_andamento", "concluida", "improcedente"],
  acao_em_andamento: ["concluida", "improcedente"],
  concluida: [],
  improcedente: [],
};

// Outcome Labels and Config
export const outcomeConfig: Record<
  OutcomeType,
  { label: string; description: string; icon: string; requiresCapa: boolean }
> = {
  imediato_correcao: {
    label: "Imediato/Correção Pontual",
    description: "Ação imediata para correção do problema",
    icon: "zap",
    requiresCapa: false,
  },
  orientacao: {
    label: "Orientação",
    description: "Orientação aos envolvidos sobre procedimentos corretos",
    icon: "message-circle",
    requiresCapa: false,
  },
  treinamento: {
    label: "Treinamento",
    description: "Necessidade de treinamento para equipe",
    icon: "graduation-cap",
    requiresCapa: true,
  },
  alteracao_processo: {
    label: "Alteração de Processo/Protocolo",
    description: "Mudança em processos ou protocolos existentes",
    icon: "file-cog",
    requiresCapa: true,
  },
  manutencao_corretiva: {
    label: "Manutenção Corretiva",
    description: "Necessidade de manutenção em equipamentos",
    icon: "wrench",
    requiresCapa: true,
  },
  notificacao_externa: {
    label: "Notificação Externa",
    description: "Necessidade de notificar órgãos externos",
    icon: "send",
    requiresCapa: false,
  },
  improcedente: {
    label: "Improcedente",
    description: "Ocorrência não procede após análise",
    icon: "x-circle",
    requiresCapa: false,
  },
};

// Check if outcomes require CAPA
export const requiresCapa = (outcomes: OutcomeType[]): boolean => {
  return outcomes.some((o) => outcomeConfig[o].requiresCapa);
};

// Check if external notification is required
export const requiresExternalNotification = (outcomes: OutcomeType[]): boolean => {
  return outcomes.includes("notificacao_externa");
};
