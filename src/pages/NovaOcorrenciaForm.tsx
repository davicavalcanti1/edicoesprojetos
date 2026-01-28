import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, FileSearch, Droplets, AlertTriangle } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { BaseInfoBlock } from "@/components/forms/BaseInfoBlock";
import { RevisaoExameForm, ExtravasamentoEnfermagemForm, ReacoesAdversasForm, PacienteForm, LivreForm } from "@/components/forms/subtypes";
import { useCreateOccurrence, useCreateNursingOccurrence, useCreatePatientOccurrence, useCreateFreeOccurrence } from "@/hooks/useOccurrences";
import { useUploadAttachments, getSignedUrlsForAttachments } from "@/hooks/useAttachments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PendingFile, AttachmentUpload } from "@/components/attachments/AttachmentUpload";
import { OccurrenceFormData, OccurrenceType, OccurrenceSubtype, subtypeLabels } from "@/types/occurrence";

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
const convertToDbDate = (dateStr: string | undefined): string | null => {
  if (!dateStr || !dateStr.includes("/")) return dateStr || null;
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year || year.length !== 4) return dateStr || null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

// Validation Schema - Relaxed for dynamic subtypes
const formSchema = z.object({
  dataHoraEvento: z.string().min(1, "Data e hora do evento é obrigatória"),
  unidadeLocal: z.string().optional(), // Made optional for base, enforced in refine
  paciente: z.object({
    nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cpf: z.string().optional(),
    telefone: z.string()
      .refine(
        (val) => val === "Não consta" || /^\(\d{2}\) \d{5}-\d{4}$/.test(val),
        "Telefone deve estar no formato (00) 00000-0000 ou selecione 'Não consta'"
      ),
    idPaciente: z.string().optional(),
    dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
    sexo: z.enum(["Masculino", "Feminino"]).optional(),
  }),
  tipo: z.string(),
  subtipo: z.string(),
  dadosEspecificos: z.record(z.any()),
}).superRefine((data, ctx) => {
  // If NOT nursing, enforce standard fields
  if (data.tipo !== 'enfermagem') {
    if (!data.unidadeLocal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unidade é obrigatória",
        path: ["unidadeLocal"],
      });
    }
    if (!data.paciente.cpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF é obrigatório",
        path: ["paciente", "cpf"],
      });
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.paciente.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF deve ter 11 dígitos no formato 000.000.000-00",
        path: ["paciente", "cpf"],
      });
    }
    if (!data.paciente.idPaciente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ID do paciente é obrigatório",
        path: ["paciente", "idPaciente"],
      });
    }
    if (!data.paciente.sexo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sexo é obrigatório",
        path: ["paciente", "sexo"],
      });
    }
  }
});

export default function NovaOcorrenciaForm() {
  const navigate = useNavigate();
  const { tipo, subtipo } = useParams<{ tipo: string; subtipo: string }>();
  const createOccurrence = useCreateOccurrence();
  const createNursingOccurrence = useCreateNursingOccurrence();
  const createPatientOccurrence = useCreatePatientOccurrence();
  const createFreeOccurrence = useCreateFreeOccurrence();
  const uploadAttachments = useUploadAttachments();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine Title and Icon based on subtype
  const getHeaderInfo = () => {
    switch (subtipo) {
      case "extravasamento_enfermagem":
        return {
          title: "Novo Extravasamento (Enfermagem)",
          description: "Registre ocorrência de extravasamento de contraste.",
          icon: Droplets,
          color: "text-sky-600",
          bg: "bg-sky-50"
        };
      case "reacoes_adversas":
        return {
          title: "Nova Reação Adversa",
          description: "Registre ocorrência de reação adversa.",
          icon: AlertTriangle,
          color: "text-amber-600",
          bg: "bg-amber-50"
        };
      case "revisao_exame":
        return {
          title: "Nova Revisão de Laudo",
          description: "Preencha os dados abaixo para solicitar uma revisão.",
          icon: FileSearch,
          color: "text-primary",
          bg: "bg-primary/20"
        };
      default:
        return {
          title: "Nova Ocorrência",
          description: `Registro de ${subtypeLabels[subtipo as OccurrenceSubtype] || "ocorrência"}.`,
          icon: FileSearch,
          color: "text-gray-600",
          bg: "bg-gray-100"
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  const form = useForm<OccurrenceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataHoraEvento: "",
      unidadeLocal: "Integração",
      paciente: {
        nomeCompleto: "",
        cpf: "",
        telefone: "",
        idPaciente: "",
        dataNascimento: "",
        sexo: undefined,
      },
      tipo: (tipo as OccurrenceType) || "revisao_exame",
      subtipo: (subtipo as OccurrenceSubtype) || "revisao_exame",
      dadosEspecificos: {},
    },
  });

  // Verify if valid type/subtype
  useEffect(() => {
    if (!tipo || !subtipo) {
      navigate("/");
    }
  }, [tipo, subtipo, navigate]);

  const onInvalid = (errors: any) => {
    console.error("Form validation errors:", errors);

    const getErrorKeys = (errObj: any, prefix = ""): string[] => {
      return Object.keys(errObj).reduce((acc: string[], key) => {
        const value = errObj[key];
        const currentPath = prefix ? `${prefix}.${key}` : key;
        if (value && value.message) {
          const friendlyName = {
            "medicoResponsavelId": "Médico Responsável",
            "nomeCompleto": "Nome do Paciente",
            "cpf": "CPF",
            "dataHoraEvento": "Data do Evento",
            "unidadeLocal": "Unidade",
            "dataNascimento": "Data de Nascimento",
            "telefone": "Telefone",
            "tipoExame": "Tipo de Exame (Paciente)",
            "sexo": "Sexo",
            "exameModalidade": "Tipo de Exame (Revisão)",
            "exameRegiao": "Região do Exame",
            "exameData": "Data do Exame",
            "laudoEntregue": "Status de Entrega do Laudo",
            "motivoRevisao": "Motivo da Revisão",
            "tipoDiscrepancia": "Tipo de Discrepância",
            "potencialImpacto": "Potencial Impacto",
            "impactoDescricao": "Descrição do Impacto",
            "acaoTomada": "Ação Tomada",
            "pessoasComunicadas": "Pessoas Comunicadas"
          }[key] || key;
          return [...acc, friendlyName];
        }
        if (value && typeof value === 'object') {
          return [...acc, ...getErrorKeys(value, currentPath)];
        }
        return acc;
      }, []);
    };

    const missingFields = getErrorKeys(errors).join(", ");

    toast({
      title: "Campos obrigatórios faltando",
      description: `Verifique: ${missingFields || "Preenchimento incompleto"}`,
      variant: "destructive",
      duration: 5000,
    });
  };

  const onSubmit = async (data: OccurrenceFormData) => {
    setIsSubmitting(true);
    try {
      // Create the occurrence
      let occurrence;

      if (data.tipo === 'enfermagem') {
        occurrence = await createNursingOccurrence.mutateAsync({
          tipo: data.tipo,
          subtipo: data.subtipo,
          paciente_nome_completo: data.paciente.nomeCompleto,
          paciente_telefone: data.paciente.telefone,
          paciente_cpf: data.paciente.cpf,
          paciente_id: data.paciente.idPaciente,
          paciente_data_nascimento: data.paciente.dataNascimento, // Let hook handle conversion
          paciente_tipo_exame: data.paciente.tipoExame, // Not stored but passed
          paciente_unidade_local: data.unidadeLocal,
          paciente_data_hora_evento: data.dataHoraEvento,
          descricao_detalhada: JSON.stringify(data.dadosEspecificos || {}),
          dados_especificos: data.dadosEspecificos,
          conduta: data.dadosEspecificos?.conduta // Extract conduta
        });
      } else if (data.tipo === 'paciente') {
        occurrence = await createPatientOccurrence.mutateAsync({
          tipo: data.tipo,
          subtipo: data.subtipo,
          paciente: data.paciente,
          descricao_detalhada: data.dadosEspecificos?.relato || JSON.stringify(data.dadosEspecificos),
          dados_especificos: data.dadosEspecificos
        });
      } else if (data.tipo === 'livre') {
        occurrence = await createFreeOccurrence.mutateAsync({
          tipo: data.tipo,
          subtipo: data.subtipo,
          titulo: data.dadosEspecificos?.titulo,
          descricao: data.dadosEspecificos?.descricao,
          paciente: data.paciente,
          dados_especificos: data.dadosEspecificos
        });
      } else if (data.tipo === 'administrativa') {
        occurrence = await createOccurrence.mutateAsync({
          ...data,
          tipo: 'administrativa',
          subtipo: data.subtipo,
          descricao_detalhada: data.dadosEspecificos?.descricao || "Sem descrição",
          dados_especificos: data.dadosEspecificos
        });
      } else {
        occurrence = await createOccurrence.mutateAsync({
          tipo: data.tipo,
          subtipo: data.subtipo,
          paciente_nome_completo: data.paciente.nomeCompleto,
          paciente_telefone: data.paciente.telefone,
          paciente_id: data.paciente.idPaciente,
          paciente_data_nascimento: convertToDbDate(data.paciente.dataNascimento),
          paciente_tipo_exame: data.paciente.tipoExame,
          paciente_unidade_local: data.unidadeLocal,
          paciente_data_hora_evento: data.dataHoraEvento,
          paciente_sexo: data.paciente.sexo,
          paciente_cpf: data.paciente.cpf,
          descricao_detalhada: JSON.stringify(data.dadosEspecificos || {}),
          dados_especificos: data.dadosEspecificos,
          medico_destino: (data.dadosEspecificos as any)?.medicoResponsavel || (data.dadosEspecificos as any)?.medicoAvaliou,
        });
      }

      let uploadedFiles: any[] = [];

      // Determine origin table for attachments
      let originTable = 'occurrences';
      if (data.tipo === 'enfermagem') originTable = 'ocorrencia_enf';
      else if (data.tipo === 'revisao_exame') originTable = 'ocorrencia_laudo';
      else if (data.tipo === 'administrativa') originTable = 'ocorrencia_adm';
      else if (data.tipo === 'paciente') originTable = 'ocorrencia_paciente';
      else if (data.tipo === 'livre') originTable = 'ocorrencia_livre';

      // Upload attachments
      if (pendingFiles.length > 0 && profile) {
        try {
          uploadedFiles = await uploadAttachments.mutateAsync({
            originId: occurrence.id,
            originTable: originTable,
            files: pendingFiles.map((pf) => pf.file),
            userId: profile.id,
          });
        } catch (uploadError) {
          console.error("Error uploading attachments:", uploadError);
          toast({
            title: "Aviso",
            description: "Ocorrência criada, mas alguns anexos não puderam ser enviados.",
            variant: "destructive",
          });
        }
      }

      // Generate signed URLs for webhook
      let attachmentsForWebhook: any[] = [];
      if (uploadedFiles.length > 0) {
        try {
          const attachmentsWithUrls = await getSignedUrlsForAttachments(uploadedFiles);
          attachmentsForWebhook = attachmentsWithUrls.map(att => ({
            file_name: att.file_name,
            mime_type: att.file_type,
            file_url: att.signed_url,
            is_image: att.is_image
          }));
        } catch (e) {
          console.error("Error generating signed utils:", e);
        }
      }

      // Trigger Webhook
      try {
        let webhookPayload: any = {
          evento: "nova_ocorrencia",
          id: occurrence.id,
          protocolo: occurrence.protocolo,
          tipo: occurrence.tipo,
          subtipo: occurrence.subtipo,
          status: occurrence.status,
          criado_em: occurrence.criado_em,
          criado_por: profile?.id,
          criado_por_nome: profile?.full_name,
          link: `${window.location.origin}/ocorrencias/${occurrence.id}`,
          timestamp: new Date().toISOString(),
          anexos: attachmentsForWebhook,
        };

        // Specific Payload Builder based on Type
        if (data.tipo === 'enfermagem') {
          webhookPayload = {
            ...webhookPayload,
            evento: "nova_ocorrencia_enf",
            tipo_incidente: data.subtipo,
            paciente: {
              nome: data.paciente.nomeCompleto,
              prontuario: data.paciente.idPaciente,
              data_nascimento: data.paciente.dataNascimento,
              unidade: data.unidadeLocal
            },
            checklist: data.dadosEspecificos,
            conduta: data.dadosEspecificos?.conduta,
            descricao_resumo: `Enfermagem: ${data.subtipo}`
          };
        } else if (data.tipo === 'paciente') {
          webhookPayload = {
            ...webhookPayload,
            evento: "nova_ocorrencia_paciente",
            paciente: {
              nome: data.paciente.nomeCompleto,
              cpf: data.paciente.cpf,
              telefone: data.paciente.telefone,
              email: data.dadosEspecificos?.email
            },
            relato: data.dadosEspecificos?.relato,
            area_envolvida: data.dadosEspecificos?.areaEnvolvida,
            classificacao: data.dadosEspecificos?.classificacao,
            descricao_resumo: `Paciente: ${data.subtipo}`
          };
        } else if (data.tipo === 'livre') {
          webhookPayload = {
            ...webhookPayload,
            evento: "nova_ocorrencia_livre",
            titulo: data.dadosEspecificos?.titulo,
            descricao: data.dadosEspecificos?.descricao,
            paciente_nome: data.paciente.nomeCompleto,
            descricao_resumo: `Livre: ${data.dadosEspecificos?.titulo || data.subtipo}`
          };
        } else if (data.tipo === 'revisao_exame' || data.subtipo === 'revisao_exame') {
          webhookPayload = {
            ...webhookPayload,
            evento: "nova_ocorrencia_laudo", // Event specific tag
            paciente: {
              nome: data.paciente.nomeCompleto,
              cpf: data.paciente.cpf,
              data_nascimento: data.paciente.dataNascimento,
              telefone: data.paciente.telefone,
            },
            exame: {
              tipo: data.paciente.tipoExame,
              regiao: data.dadosEspecificos?.exameRegiao,
              data: data.dadosEspecificos?.exameData,
              unidade: data.unidadeLocal
            },
            revisao: {
              medico_responsavel: data.dadosEspecificos?.medicoResponsavelId, // Or Name if available
              laudo_entregue: data.dadosEspecificos?.laudoEntregue === 'sim',
              motivo: data.dadosEspecificos?.motivoRevisao,
              motivo_outro: data.dadosEspecificos?.motivoRevisaoOutro,
              discrepancia: data.dadosEspecificos?.tipoDiscrepancia
            },
            acao_tomada: data.dadosEspecificos?.acaoTomada,
            pessoas_comunicadas: data.dadosEspecificos?.pessoasComunicadas,
            // Fallback description for generic readers
            descricao_resumo: `Revisão de Laudo: ${data.dadosEspecificos?.motivoRevisao}`
          };
        } else if (data.tipo === 'administrativa') {
          // Administrative Payload
          webhookPayload = {
            ...webhookPayload,
            evento: "nova_ocorrencia_adm",
            categoria: data.subtipo,
            descricao_detalhada: data.dadosEspecificos?.descricao || "Sem descrição detalhada",
            paciente: {
              nome: data.paciente.nomeCompleto,
              cpf: data.paciente.cpf,
              unidade: data.unidadeLocal,
              id: data.paciente.idPaciente,
              telefone: data.paciente.telefone
            },
            dados_especificos: data.dadosEspecificos,
            // Fallback for list views
            descricao_resumo: `Administrativa: ${data.subtipo}`
          };
        } else {
          // Standard/Generic Payload Fallback
          webhookPayload = {
            ...webhookPayload,
            descricao_detalhada: occurrence.descricao_detalhada || JSON.stringify(data.dadosEspecificos),
            paciente_nome_completo: data.paciente.nomeCompleto,
            paciente_unidade_local: data.unidadeLocal,
            dados_especificos: data.dadosEspecificos
          };
        }

        // Fire and forget
        fetch("https://n8n.imagoradiologia.cloud/webhook/envio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        }).catch(err => console.error("Webhook error:", err));
      } catch (webhookError) {
        console.error("Error creating webhook payload:", webhookError);
      }

      navigate("/ocorrencias");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = createOccurrence.isPending || createNursingOccurrence.isPending || uploadAttachments.isPending || isSubmitting;

  return (
    <MainLayout>
      <div className="relative z-10 mx-auto max-w-4xl">
        <Button
          type="button"
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground hover:bg-white/20"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl rounded-3xl overflow-hidden animate-fade-in duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 border-b border-white/20">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl ${headerInfo.bg} flex items-center justify-center ${headerInfo.color} shadow-inner`}>
                <HeaderIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {headerInfo.title}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {headerInfo.description}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                {/* Base Info Block */}
                <BaseInfoBlock form={form} />

                <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Subtype Specific Forms */}
                {subtipo === "revisao_exame" && (
                  <RevisaoExameForm
                    form={form}
                    pendingFiles={pendingFiles}
                    onFilesChange={setPendingFiles}
                  />
                )}

                {subtipo === "extravasamento_enfermagem" && (
                  <ExtravasamentoEnfermagemForm form={form} />
                )}

                {subtipo === "reacoes_adversas" && (
                  <ReacoesAdversasForm form={form} />
                )}

                {tipo === "paciente" && (
                  <PacienteForm form={form} />
                )}

                {tipo === "livre" && (
                  <LivreForm form={form} />
                )}

                {/* Generic Attachment Upload for Enfermagem Forms */}
                {(subtipo === "extravasamento_enfermagem" || subtipo === "reacoes_adversas") && (
                  <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Anexos</h3>
                      <p className="text-sm text-muted-foreground">Adicione fotos ou documentos relevantes.</p>
                    </div>

                    <AttachmentUpload
                      files={pendingFiles}
                      onChange={setPendingFiles}
                      maxFiles={5}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="flex-1 sm:flex-none h-12 border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 sm:flex-none sm:min-w-[250px] h-12 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        {uploadAttachments.isPending ? "Enviando anexos..." : "Processando..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Registrar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
