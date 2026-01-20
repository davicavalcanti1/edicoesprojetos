import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertTriangle, FileText, User, Heart, Briefcase, Wrench, Send, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { StatusFlow } from "@/components/flow/StatusFlow";
import { OutcomeSelector } from "@/components/flow/OutcomeSelector";
import { ExternalNotificationForm } from "@/components/flow/ExternalNotificationForm";
import { CAPAForm } from "@/components/flow/CAPAForm";
import { TriageSelector } from "@/components/triage/TriageSelector";
import { TriageBadge } from "@/components/triage/TriageBadge";
import { ExportDialog } from "@/components/export/ExportDialog";
import { FormattedDetails } from "@/components/occurrence/FormattedDetails";
import { SendToDoctorModal } from "@/components/occurrence/SendToDoctorModal";
import { DoctorMessageSection } from "@/components/occurrence/DoctorMessageSection";
import { AttachmentsSection } from "@/components/occurrence/AttachmentsSection";
import { AttachmentUpload, PendingFile } from "@/components/attachments/AttachmentUpload";
import { useToast } from "@/hooks/use-toast";
import { generateAndStorePdf } from "@/lib/pdf/generate-and-store-pdf";
import { useAttachmentsWithSignedUrls, useUploadAttachments } from "@/hooks/useAttachments";
import { downloadOccurrencePDF } from "@/lib/pdf/occurrence-pdf";
import { Occurrence } from "@/types/occurrence";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOccurrence, useUpdateOccurrence, useUpdateOccurrenceStatus } from "@/hooks/useOccurrences";
import {
  OccurrenceStatus,
  OccurrenceOutcome,
  ExternalNotification,
  CAPA,
  statusConfig,
  triageConfig,
  outcomeConfig,
  requiresCapa,
  requiresExternalNotification,
  OutcomeType,
  TriageClassification,
} from "@/types/occurrence";

const typeConfig = {
  assistencial: { icon: Heart, color: "text-occurrence-assistencial", bgColor: "bg-occurrence-assistencial/10" },
  administrativa: { icon: Briefcase, color: "text-occurrence-administrativa", bgColor: "bg-occurrence-administrativa/10" },
  tecnica: { icon: Wrench, color: "text-occurrence-tecnica", bgColor: "bg-occurrence-tecnica/10" },
  livre: { icon: FileText, color: "text-purple-600", bgColor: "bg-purple-100" },
};

export default function OccurrenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, profile } = useAuth();

  const { data: occurrence, isLoading, refetch } = useOccurrence(id);
  const updateOccurrence = useUpdateOccurrence();
  const updateStatus = useUpdateOccurrenceStatus();
  const uploadAttachments = useUploadAttachments();

  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSendToDoctorOpen, setIsSendToDoctorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [outcome, setOutcome] = useState<Partial<OccurrenceOutcome>>({});
  const [externalNotification, setExternalNotification] = useState<ExternalNotification>({
    orgaoNotificado: "",
    data: "",
    responsavel: "",
  });
  const [capas, setCapas] = useState<CAPA[]>([]);

  const [pacienteSexo, setPacienteSexo] = useState<string>("");
  const [pacienteUnidade, setPacienteUnidade] = useState<string>("");
  const [pacienteTipoExame, setPacienteTipoExame] = useState<string>("");
  const [pacienteNome, setPacienteNome] = useState<string>("");
  const [pacienteId, setPacienteId] = useState<string>("");
  const [descricaoDetalhada, setDescricaoDetalhada] = useState<string>("");
  const [impactoPercebido, setImpactoPercebido] = useState<string>("");
  const [medicoDestino, setMedicoDestino] = useState<string>("");
  const [pacienteDataNascimento, setPacienteDataNascimento] = useState<string>("");

  useEffect(() => {
    if (occurrence) {
      setPacienteSexo(occurrence.paciente_sexo || "");
      setPacienteUnidade(occurrence.paciente_unidade_local || "");
      setPacienteTipoExame(occurrence.paciente_tipo_exame || "");
      setPacienteNome(occurrence.paciente_nome_completo || "");
      setPacienteId(occurrence.paciente_id || "");
      setDescricaoDetalhada(occurrence.descricao_detalhada || "");
      setImpactoPercebido(occurrence.impacto_percebido || "");
      setMedicoDestino(occurrence.medico_destino || "");
      if (occurrence.paciente_data_nascimento) {
        const [year, month, day] = occurrence.paciente_data_nascimento.split("-");
        setPacienteDataNascimento(`${day}/${month}/${year}`);
      } else {
        setPacienteDataNascimento("");
      }

      if (occurrence.desfecho_tipos) {
        setOutcome({
          tipos: occurrence.desfecho_tipos as OutcomeType[],
          justificativa: occurrence.desfecho_justificativa || "",
          desfechoPrincipal: occurrence.desfecho_principal as OutcomeType,
          definidoPor: occurrence.desfecho_definido_por || "",
          definidoEm: occurrence.desfecho_definido_em || "",
        });
      }
    }
  }, [occurrence]);

  const isRevisaoLaudo = occurrence?.subtipo === "revisao_exame";

  // Transform DB occurrence to Occurrence type for ExportDialog
  const transformToOccurrence = (): Partial<Occurrence> | undefined => {
    if (!occurrence) return undefined;
    return {
      id: occurrence.id,
      protocolo: occurrence.protocolo,
      tenantId: occurrence.tenant_id,
      criadoPor: occurrence.criado_por,
      criadoEm: occurrence.criado_em,
      atualizadoEm: occurrence.atualizado_em,
      status: occurrence.status as any,
      triagem: occurrence.triagem as any,
      triagemPor: occurrence.triagem_por || undefined,
      triagemEm: occurrence.triagem_em || undefined,
      tipo: occurrence.tipo as any,
      subtipo: occurrence.subtipo as any,
      descricaoDetalhada: occurrence.descricao_detalhada,
      acaoImediata: occurrence.acao_imediata || "",
      impactoPercebido: occurrence.impacto_percebido || "",
      pessoasEnvolvidas: occurrence.pessoas_envolvidas || undefined,
      contemDadoSensivel: occurrence.contem_dado_sensivel || false,
      dadosEspecificos: occurrence.dados_especificos,
      paciente: {
        nomeCompleto: occurrence.paciente_nome_completo || "",
        telefone: occurrence.paciente_telefone || "",
        idPaciente: occurrence.paciente_id || "",
        dataNascimento: occurrence.paciente_data_nascimento || "",
        tipoExame: occurrence.paciente_tipo_exame || "",
        unidadeLocal: occurrence.paciente_unidade_local || "",
        dataHoraEvento: occurrence.paciente_data_hora_evento || "",
        sexo: occurrence.paciente_sexo as any,
      },
      desfecho: occurrence.desfecho_tipos?.length
        ? {
          tipos: occurrence.desfecho_tipos as any,
          justificativa: occurrence.desfecho_justificativa || "",
          desfechoPrincipal: occurrence.desfecho_principal as any,
          definidoPor: occurrence.desfecho_definido_por || "",
          definidoEm: occurrence.desfecho_definido_em || "",
        }
        : undefined,
      historicoStatus: [],
    };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!occurrence) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Ocorrência não encontrada</p>
          <Button onClick={() => navigate("/ocorrencias")}>Voltar para Lista</Button>
        </div>
      </MainLayout>
    );
  }

  const TypeIcon = typeConfig[occurrence.tipo as keyof typeof typeConfig]?.icon || FileText;

  const handleStatusChange = (newStatus: OccurrenceStatus) => {
    updateStatus.mutate({
      occurrenceId: occurrence.id,
      currentStatus: occurrence.status as OccurrenceStatus,
      newStatus,
    });
  };

  const handleTriageSelect = (triage: TriageClassification) => {
    updateOccurrence.mutate({
      id: occurrence.id,
      triagem: triage,
    }, {
      onSuccess: () => {
        toast({
          title: "Triagem realizada",
          description: `Classificação definida como "${triageConfig[triage].label}"`,
        });
        setIsTriageOpen(false);

        // For Revisão de Laudo, open the doctor modal after triage
        if (isRevisaoLaudo) {
          refetch().then(() => {
            setIsSendToDoctorOpen(true);
          });
        }
      },
    });
  };

  const handleDoctorForwardSuccess = () => {
    refetch();
  };

  const handleSave = async () => {
    const selectedOutcomes = outcome.tipos || [];

    if (requiresExternalNotification(selectedOutcomes)) {
      if (!externalNotification.orgaoNotificado || !externalNotification.data || !externalNotification.responsavel) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios da notificação externa.",
          variant: "destructive",
        });
        return;
      }
    }

    if (requiresCapa(selectedOutcomes) && capas.length === 0) {
      toast({
        title: "CAPA obrigatória",
        description: "Adicione pelo menos uma ação corretiva/preventiva.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateOccurrence.mutateAsync({
        id: occurrence.id,
        desfecho_tipos: selectedOutcomes,
        desfecho_justificativa: outcome.justificativa,
        notificacao_orgao: externalNotification.orgaoNotificado,
        notificacao_data: externalNotification.data,
        notificacao_responsavel: externalNotification.responsavel,
        paciente_sexo: pacienteSexo,
        paciente_unidade_local: pacienteUnidade,
        paciente_nome_completo: pacienteNome,
        paciente_id: pacienteId,
        paciente_data_nascimento: (() => {
          if (!pacienteDataNascimento || !pacienteDataNascimento.includes("/")) return null;
          const [day, month, year] = pacienteDataNascimento.split("/");
          return `${year}-${month}-${day}`;
        })(),
        descricao_detalhada: descricaoDetalhada,
        impacto_percebido: impactoPercebido,
        medico_destino: medicoDestino,
      });

      // Upload pending files if any
      if (pendingFiles.length > 0) {
        await uploadAttachments.mutateAsync({
          occurrenceId: occurrence.id,
          files: pendingFiles.map(pf => pf.file),
          userId: profile?.id || "",
        });
        setPendingFiles([]);
      }

      toast({
        title: "Alterações salvas",
        description: "As informações da ocorrência foram atualizadas com sucesso.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const showExternalNotification = requiresExternalNotification(outcome.tipos || []);
  const showCapa = requiresCapa(outcome.tipos || []);
  const capaOutcomes = (outcome.tipos || [])
    .filter((o) => outcomeConfig[o].requiresCapa)
    .map((o) => outcomeConfig[o].label);

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/ocorrencias")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lista
        </Button>

        {/* Header */}
        <div className="rounded-xl border border-border bg-white/60 backdrop-blur-xl border-white/40 shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-3 ${typeConfig[occurrence.tipo as keyof typeof typeConfig]?.bgColor || "bg-muted"}`}>
                <TypeIcon className={`h-6 w-6 ${typeConfig[occurrence.tipo as keyof typeof typeConfig]?.color || "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocolo</p>
                <h1 className="text-xl font-bold font-mono text-foreground">
                  {occurrence.protocolo}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[occurrence.status as OccurrenceStatus]?.bgColor || "bg-gray-100"} ${statusConfig[occurrence.status as OccurrenceStatus]?.color || "text-gray-700"}`}
                  >
                    {statusConfig[occurrence.status as OccurrenceStatus]?.label || occurrence.status}
                  </span>
                  {occurrence.triagem && <TriageBadge triage={occurrence.triagem as TriageClassification} size="sm" />}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-muted-foreground text-right">
                <p>
                  Registrado em{" "}
                  {format(new Date(occurrence.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <p>por {occurrence.criador_nome || "Usuário"}</p>
              </div>

              <div className="flex gap-2">
                {isRevisaoLaudo && isAdmin && occurrence.triagem && occurrence.status !== "concluida" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsSendToDoctorOpen(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {occurrence.encaminhada_em ? "Reenviar para Médico" : "Encaminhar para Médico"}
                  </Button>
                )}

                {isAdmin && occurrence.status === "concluida" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadOccurrencePDF(transformToOccurrence() as any);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Flow */}
        <div className="mb-6">
          <StatusFlow
            currentStatus={occurrence.status as OccurrenceStatus}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        </div>

        {/* Triage Section (Admin only) */}
        {isAdmin && !occurrence.triagem && (
          <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Triagem Pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta ocorrência ainda não foi triada. Realize a classificação de gravidade.
                </p>
              </div>
              <Button onClick={() => setIsTriageOpen(true)}>Realizar Triagem</Button>
            </div>
          </div>
        )}

        {/* Patient Data Summary */}
        <div className="rounded-xl border border-border bg-white/60 backdrop-blur-xl border-white/40 shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dados do Paciente</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              {isAdmin ? (
                <input
                  type="text"
                  value={pacienteNome}
                  onChange={(e) => setPacienteNome(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                />
              ) : (
                <p className="font-medium">{occurrence.paciente_nome_completo || "-"}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">ID</p>
              {isAdmin ? (
                <input
                  type="text"
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                />
              ) : (
                <p className="font-medium">{occurrence.paciente_id || "-"}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Unidade</p>
              {isAdmin ? (
                <input
                  type="text"
                  value={pacienteUnidade}
                  onChange={(e) => setPacienteUnidade(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                />
              ) : (
                <p className="font-medium">{occurrence.paciente_unidade_local || "-"}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Data de Nascimento</p>
              {isAdmin ? (
                <input
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={pacienteDataNascimento}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    let formatted = val;
                    if (val.length > 2) formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
                    if (val.length > 4) formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
                    setPacienteDataNascimento(formatted);
                  }}
                  maxLength={10}
                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                />
              ) : (
                <p className="font-medium">
                  {(() => {
                    try {
                      if (!occurrence.paciente_data_nascimento) return "-";
                      // Check if it's already in DD/MM/YYYY format to avoid re-formatting or invalid Date parsing
                      if (occurrence.paciente_data_nascimento.includes('/')) return occurrence.paciente_data_nascimento;

                      return format(new Date(occurrence.paciente_data_nascimento + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
                    } catch (e) {
                      return occurrence.paciente_data_nascimento || "-";
                    }
                  })()}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Data/Hora do Evento</p>
              <p className="font-medium">
                {(() => {
                  try {
                    return occurrence.paciente_data_hora_evento
                      ? format(new Date(occurrence.paciente_data_hora_evento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "-";
                  } catch (e) {
                    return occurrence.paciente_data_hora_evento || "-";
                  }
                })()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium">{occurrence.paciente_telefone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sexo</p>
              {isAdmin ? (
                <select
                  value={pacienteSexo}
                  onChange={(e) => setPacienteSexo(e.target.value)}
                  className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-1"
                >
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              ) : (
                <p className="font-medium">{occurrence.paciente_sexo || "-"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Occurrence Details */}
        <div className="rounded-xl border border-border bg-white/60 backdrop-blur-xl border-white/40 shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Detalhes da Ocorrência</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">Descrição Detalhada</p>
              {isAdmin ? (
                <div className="space-y-2">
                  <FormattedDetails content={descricaoDetalhada} />
                  <details className="cursor-pointer">
                    <summary className="text-xs text-muted-foreground hover:text-primary transition-colors">Ver/Editar Texto Original</summary>
                    <textarea
                      value={descricaoDetalhada}
                      onChange={(e) => setDescricaoDetalhada(e.target.value)}
                      className="w-full bg-transparent border border-border rounded-md p-2 mt-2 focus:border-primary outline-none font-mono text-xs"
                      rows={4}
                    />
                  </details>
                </div>
              ) : (
                <FormattedDetails content={occurrence.descricao_detalhada} />
              )}
            </div>
            {occurrence.acao_imediata && (
              <div>
                <p className="text-muted-foreground mb-1">Ação Imediata Tomada</p>
                <p className="text-foreground">{occurrence.acao_imediata}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1">Impacto Percebido</p>
                {isAdmin ? (
                  <input
                    type="text"
                    value={impactoPercebido}
                    onChange={(e) => setImpactoPercebido(e.target.value)}
                    className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                  />
                ) : (
                  <p className="text-foreground">{occurrence.impacto_percebido || "-"}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Médico Responsável</p>
                {isAdmin ? (
                  <input
                    type="text"
                    value={medicoDestino}
                    onChange={(e) => setMedicoDestino(e.target.value)}
                    className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-0.5"
                  />
                ) : (
                  <p className="text-foreground">{occurrence.medico_destino || "-"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Message Section (for Revisão de Laudo) */}
        {isRevisaoLaudo && occurrence.encaminhada_em && (
          <DoctorMessageSection
            mensagemMedico={occurrence.mensagem_medico}
            medicoDestino={occurrence.medico_destino}
            encaminhadaEm={occurrence.encaminhada_em}
            finalizadaEm={occurrence.finalizada_em}
          />
        )}

        {/* Attachments Section (only for Revisão de Exame) */}
        <AttachmentsSection
          occurrenceId={occurrence.id}
          subtipo={occurrence.subtipo}
        />

        {/* Upload New Attachments (Admin only) */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-white/60 backdrop-blur-xl border-white/40 shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Paperclip className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Adicionar Novos Anexos</h3>
            </div>
            <AttachmentUpload
              files={pendingFiles}
              onChange={setPendingFiles}
              maxFiles={10}
            />
          </div>
        )}

        {/* Outcome Selector (Admin only) */}
        {isAdmin && (
          <>
            <div className="mb-6">
              <OutcomeSelector value={outcome} onChange={setOutcome} />
            </div>

            {/* External Notification Form */}
            {showExternalNotification && (
              <div className="mb-6">
                <ExternalNotificationForm
                  value={externalNotification}
                  onChange={setExternalNotification}
                />
              </div>
            )}

            {/* CAPA Form */}
            {showCapa && (
              <div className="mb-6">
                <CAPAForm
                  value={capas}
                  onChange={setCapas}
                  triggerOutcomes={capaOutcomes}
                />
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/ocorrencias")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Triage Modal */}
        <TriageSelector
          open={isTriageOpen}
          onOpenChange={setIsTriageOpen}
          currentTriage={occurrence.triagem as TriageClassification}
          onTriageSelect={handleTriageSelect}
        />

        {/* Export Dialog - temporarily disabled
        <ExportDialog
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          mode="single"
          occurrence={transformToOccurrence() as any}
        />
        */}

        {/* Send to Doctor Modal (for Revisão de Laudo) */}
        {isRevisaoLaudo && (
          <SendToDoctorModal
            open={isSendToDoctorOpen}
            onOpenChange={setIsSendToDoctorOpen}
            occurrenceId={occurrence.id}
            protocolo={occurrence.protocolo}
            pacienteNome={occurrence.paciente_nome_completo}
            pacienteTipoExame={occurrence.paciente_tipo_exame}
            pacienteUnidade={occurrence.paciente_unidade_local}
            pacienteDataHoraEvento={occurrence.paciente_data_hora_evento}
            initialMedicoNome={occurrence.medico_destino}
            initialMensagem={occurrence.mensagem_admin_medico}
            onSuccess={handleDoctorForwardSuccess}
          />
        )}
      </div>
    </MainLayout >
  );
}
