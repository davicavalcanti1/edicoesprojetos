import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { triggerWebhook, sendToWebhook } from "@/hooks/useTenantSettings";
import { generateAndStorePdf } from "@/lib/pdf/generate-and-store-pdf";
import type {
  OccurrenceType,
  OccurrenceSubtype,
  OccurrenceStatus,
  TriageClassification,
  OutcomeType
} from "@/types/occurrence";

// Database occurrence type
export interface DbOccurrence {
  id: string;
  tenant_id: string;
  protocolo: string;
  tipo: string;
  subtipo: string;
  paciente_nome_completo: string | null;
  paciente_telefone: string | null;
  paciente_id: string | null;
  paciente_data_nascimento: string | null;
  paciente_tipo_exame: string | null;
  paciente_unidade_local: string | null;
  paciente_data_hora_evento: string | null;
  paciente_sexo?: string | null;
  descricao_detalhada: string;
  acao_imediata: string | null;
  impacto_percebido: string | null;
  pessoas_envolvidas: string | null;
  contem_dado_sensivel: boolean;
  status: string;
  triagem: string | null;
  triagem_por: string | null;
  triagem_em: string | null;
  desfecho_tipos: string[] | null;
  desfecho_justificativa: string | null;
  desfecho_principal: string | null;
  desfecho_definido_por: string | null;
  desfecho_definido_em: string | null;
  notificacao_orgao: string | null;
  notificacao_data: string | null;
  notificacao_responsavel: string | null;
  notificacao_anexo_url: string | null;
  pdf_conclusao_url: string | null;
  pdf_gerado_em: string | null;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  // New fields for "Revisão de Laudo" workflow
  public_token: string | null;
  medico_destino: string | null;
  mensagem_admin_medico: string | null;
  mensagem_medico: string | null;
  encaminhada_em: string | null;
  finalizada_em: string | null;
  dados_especificos: Record<string, any> | null;
  // Joined data
  criador_nome?: string;
  triador_nome?: string;
}

export interface CreateOccurrenceInput {
  tipo: OccurrenceType;
  subtipo: OccurrenceSubtype;
  paciente_nome_completo?: string;
  paciente_telefone?: string;
  paciente_id?: string;
  paciente_data_nascimento?: string;
  paciente_tipo_exame?: string;
  paciente_unidade_local?: string;
  paciente_data_hora_evento?: string;
  paciente_sexo?: string;
  descricao_detalhada: string;
  acao_imediata?: string;
  impacto_percebido?: string;
  pessoas_envolvidas?: string;
  contem_dado_sensivel?: boolean;
  dados_especificos?: unknown;
  medico_destino?: string;
}

export interface UpdateOccurrenceInput {
  id: string;
  status?: OccurrenceStatus;
  triagem?: TriageClassification;
  desfecho_tipos?: OutcomeType[];
  desfecho_justificativa?: string;
  desfecho_principal?: OutcomeType;
  notificacao_orgao?: string;
  notificacao_data?: string;
  notificacao_responsavel?: string;
  // Additional fields for editing
  paciente_nome_completo?: string;
  paciente_id?: string;
  paciente_telefone?: string;
  paciente_data_nascimento?: string;
  paciente_sexo?: string;
  paciente_tipo_exame?: string;
  paciente_unidade_local?: string;
  paciente_data_hora_evento?: string;
  descricao_detalhada?: string;
  acao_imediata?: string;
  impacto_percebido?: string;
  pessoas_envolvidas?: string;
  contem_dado_sensivel?: boolean;
  medico_destino?: string;
}

// Fetch all occurrences for the tenant
export function useOccurrences() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["occurrences", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occurrences")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Fetch creator names separately to avoid FK issues
      const occurrences = data || [];
      const creatorIds = [...new Set(occurrences.map(o => o.criado_por).filter(Boolean))];

      let creatorMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", creatorIds);

        if (profiles) {
          creatorMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {});
        }
      }

      return occurrences.map((occ: any) => ({
        ...occ,
        criador_nome: creatorMap[occ.criado_por] || null,
        triador_nome: occ.triagem_por ? creatorMap[occ.triagem_por] : null,
      })) as DbOccurrence[];
    },
    enabled: !!profile?.tenant_id,
  });
}

// Fetch a single occurrence by ID
export function useOccurrence(id: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["occurrence", id],
    queryFn: async () => {
      if (!id) return null;

      // 1. Try fetching from main occurrences table
      const { data: mainData, error: mainError } = await supabase
        .from("occurrences")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (mainError) throw mainError;

      if (mainData) {
        // Fetch creator name for main occurrence
        let criadorNome = null;
        if (mainData.criado_por) {
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", mainData.criado_por)
            .maybeSingle();
          criadorNome = creatorProfile?.full_name || null;
        }

        return {
          ...mainData,
          criador_nome: criadorNome,
          triador_nome: null,
        } as DbOccurrence;
      }

      // 2. If not found, try fetching from patient_occurrences table
      const { data: patientData, error: patientError } = await supabase
        .from("patient_occurrences" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (patientError) throw patientError;

      if (patientData) {
        // Map patient_occurrences to DbOccurrence structure
        return {
          id: patientData.id,
          tenant_id: patientData.tenant_id,
          protocolo: patientData.protocol,
          tipo: 'assistencial', // Default to assistencial or create a 'paciente' type if supported
          subtipo: 'relato_paciente',
          paciente_nome_completo: patientData.patient_name,
          paciente_telefone: patientData.patient_phone,
          paciente_data_nascimento: patientData.patient_birth_date,
          // Map other patient fields if they exist in table
          descricao_detalhada: patientData.description,
          status: (patientData.status === 'pendente' ? 'registrada' : patientData.status) || 'registrada',
          criado_em: patientData.created_at,
          atualizado_em: patientData.created_at,
          criado_por: patientData.is_anonymous ? 'Anônimo' : 'Paciente',
          criador_nome: patientData.is_anonymous ? 'Anônimo' : (patientData.patient_name || 'Paciente'),
          contem_dado_sensivel: false,

          // Defaults for required fields
          acao_imediata: null,
          impacto_percebido: null,
          pessoas_envolvidas: null,
          triagem: null,
          triagem_por: null,
          triagem_em: null,
          desfecho_tipos: null,
          desfecho_justificativa: null,
          desfecho_principal: null,
          desfecho_definido_por: null,
          desfecho_definido_em: null,
          notificacao_orgao: null,
          notificacao_data: null,
          notificacao_responsavel: null,
          notificacao_anexo_url: null,
          pdf_conclusao_url: null,
          pdf_gerado_em: null,
          public_token: null,
          medico_destino: null,
          mensagem_admin_medico: null,
          mensagem_medico: null,
          encaminhada_em: null,
          finalizada_em: null,
          dados_especificos: null,
        } as unknown as DbOccurrence;
      }

      return null;
    },
    enabled: !!id && !!profile?.tenant_id,
  });
}

// Create a new occurrence
export function useCreateOccurrence() {
  const queryClient = useQueryClient();
  const { profile, tenant } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateOccurrenceInput) => {
      if (!profile || !tenant) throw new Error("Usuário não autenticado");

      // Generate protocol using the database function
      const { data: protocolo, error: protoError } = await supabase
        .rpc("generate_protocol_number", { p_tenant_id: tenant.id });

      if (protoError) throw protoError;

      const { data, error } = await supabase
        .from("occurrences")
        .insert({
          tenant_id: tenant.id,
          protocolo,
          tipo: input.tipo,
          subtipo: input.subtipo,
          paciente_nome_completo: input.paciente_nome_completo,
          paciente_telefone: input.paciente_telefone,
          paciente_id: input.paciente_id,
          paciente_data_nascimento: input.paciente_data_nascimento,
          paciente_tipo_exame: input.paciente_tipo_exame,
          paciente_unidade_local: input.paciente_unidade_local,
          paciente_data_hora_evento: input.paciente_data_hora_evento,
          paciente_sexo: (input as any).paciente_sexo,
          descricao_detalhada: input.descricao_detalhada,
          acao_imediata: input.acao_imediata,
          impacto_percebido: input.impacto_percebido,
          pessoas_envolvidas: input.pessoas_envolvidas,
          contem_dado_sensivel: input.contem_dado_sensivel || false,
          dados_especificos: input.dados_especificos as any || {},
          medico_destino: input.medico_destino,
          criado_por: profile.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Insert initial status history
      await supabase.from("occurrence_status_history").insert({
        occurrence_id: data.id,
        status_de: "registrada",
        status_para: "registrada",
        alterado_por: profile.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      toast({
        title: "Ocorrência registrada",
        description: "A ocorrência foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar ocorrência",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update an occurrence
export function useUpdateOccurrence() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateOccurrenceInput) => {
      if (!profile) throw new Error("Usuário não autenticado");

      const updateData: any = {};
      let shouldAdvanceStatus = false;
      let currentStatus: OccurrenceStatus | null = null;

      // Fetch current occurrence to check status
      if (input.triagem) {
        const { data: currentOcc } = await supabase
          .from("occurrences")
          .select("status")
          .eq("id", input.id)
          .single();

        if (currentOcc) {
          currentStatus = currentOcc.status as OccurrenceStatus;
          // If occurrence is "registrada" or "em_triagem" and triage is being set, advance to "em_analise"
          if (currentStatus === "registrada" || currentStatus === "em_triagem") {
            shouldAdvanceStatus = true;
            updateData.status = "em_analise";
          }
        }
      }

      if (input.status) updateData.status = input.status;
      if (input.triagem) {
        updateData.triagem = input.triagem;
        updateData.triagem_por = profile.id;
        updateData.triagem_em = new Date().toISOString();
      }
      if (input.desfecho_tipos) {
        updateData.desfecho_tipos = input.desfecho_tipos;
        updateData.desfecho_definido_por = profile.id;
        updateData.desfecho_definido_em = new Date().toISOString();
      }
      if (input.desfecho_justificativa) updateData.desfecho_justificativa = input.desfecho_justificativa;
      if (input.desfecho_principal) updateData.desfecho_principal = input.desfecho_principal;
      if (input.notificacao_orgao) updateData.notificacao_orgao = input.notificacao_orgao;
      if (input.notificacao_data) updateData.notificacao_data = input.notificacao_data;
      if (input.notificacao_responsavel) updateData.notificacao_responsavel = input.notificacao_responsavel;

      // Additional fields for editing
      if (input.paciente_nome_completo !== undefined) updateData.paciente_nome_completo = input.paciente_nome_completo;
      if (input.paciente_id !== undefined) updateData.paciente_id = input.paciente_id;
      if (input.paciente_telefone !== undefined) updateData.paciente_telefone = input.paciente_telefone;
      if (input.paciente_data_nascimento !== undefined) updateData.paciente_data_nascimento = input.paciente_data_nascimento;
      if (input.paciente_sexo !== undefined) updateData.paciente_sexo = input.paciente_sexo;
      if (input.paciente_tipo_exame !== undefined) updateData.paciente_tipo_exame = input.paciente_tipo_exame;
      if (input.paciente_unidade_local !== undefined) updateData.paciente_unidade_local = input.paciente_unidade_local;
      if (input.paciente_data_hora_evento !== undefined) updateData.paciente_data_hora_evento = input.paciente_data_hora_evento;
      if (input.descricao_detalhada !== undefined) updateData.descricao_detalhada = input.descricao_detalhada;
      if (input.acao_imediata !== undefined) updateData.acao_imediata = input.acao_imediata;
      if (input.impacto_percebido !== undefined) updateData.impacto_percebido = input.impacto_percebido;
      if (input.pessoas_envolvidas !== undefined) updateData.pessoas_envolvidas = input.pessoas_envolvidas;
      if (input.contem_dado_sensivel !== undefined) updateData.contem_dado_sensivel = input.contem_dado_sensivel;

      const { data, error } = await supabase
        .from("occurrences")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;

      // Insert status history if status was advanced due to triage
      if (shouldAdvanceStatus && currentStatus) {
        await supabase.from("occurrence_status_history").insert({
          occurrence_id: input.id,
          status_de: currentStatus,
          status_para: "em_analise",
          alterado_por: profile.id,
          motivo: "Triagem realizada",
        });
      }

      return { ...data, statusAdvanced: shouldAdvanceStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      queryClient.invalidateQueries({ queryKey: ["occurrence", data.id] });
      queryClient.invalidateQueries({ queryKey: ["occurrence-stats"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ocorrência",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update occurrence status with history
export function useUpdateOccurrenceStatus() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      occurrenceId,
      currentStatus,
      newStatus,
      motivo
    }: {
      occurrenceId: string;
      currentStatus: OccurrenceStatus;
      newStatus: OccurrenceStatus;
      motivo?: string;
    }) => {
      if (!profile) throw new Error("Usuário não autenticado");

      // Update the occurrence status
      const { error: updateError } = await supabase
        .from("occurrences")
        .update({ status: newStatus })
        .eq("id", occurrenceId);

      if (updateError) throw updateError;

      // Insert status history
      const { error: historyError } = await supabase
        .from("occurrence_status_history")
        .insert({
          occurrence_id: occurrenceId,
          status_de: currentStatus,
          status_para: newStatus,
          alterado_por: profile.id,
          motivo,
        });

      if (historyError) throw historyError;

      // If status changed to "concluida", generate PDF and send to webhook
      if (newStatus === "concluida") {
        const { data: occurrenceData } = await supabase
          .from("occurrences")
          .select("*")
          .eq("id", occurrenceId)
          .single();

        if (occurrenceData) {
          // Generate and store PDF
          const pdfUrl = await generateAndStorePdf(occurrenceData as DbOccurrence);

          // Fetch creator name
          let criadorNome = null;
          if (occurrenceData.criado_por) {
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", occurrenceData.criado_por)
              .maybeSingle();
            criadorNome = creatorProfile?.full_name || null;
          }

          // Fetch attachments
          const { data: attachments } = await supabase
            .from("occurrence_attachments")
            .select("id, file_name, file_url, file_type, file_size, is_image")
            .eq("occurrence_id", occurrenceId);

          // Prepare webhook payload with all occurrence data
          const webhookPayload = {
            evento: "ocorrencia_finalizada",
            id: occurrenceData.id,
            protocolo: occurrenceData.protocolo,
            tipo: occurrenceData.tipo,
            subtipo: occurrenceData.subtipo,
            status: newStatus,
            triagem: occurrenceData.triagem,
            triagem_em: occurrenceData.triagem_em,
            descricao_detalhada: occurrenceData.descricao_detalhada,
            acao_imediata: occurrenceData.acao_imediata,
            impacto_percebido: occurrenceData.impacto_percebido,
            paciente_nome_completo: occurrenceData.paciente_nome_completo,
            paciente_id: occurrenceData.paciente_id,
            paciente_telefone: occurrenceData.paciente_telefone,
            paciente_tipo_exame: occurrenceData.paciente_tipo_exame,
            paciente_unidade_local: occurrenceData.paciente_unidade_local,
            paciente_data_nascimento: occurrenceData.paciente_data_nascimento,
            paciente_data_hora_evento: occurrenceData.paciente_data_hora_evento,
            pessoas_envolvidas: occurrenceData.pessoas_envolvidas,
            contem_dado_sensivel: occurrenceData.contem_dado_sensivel,
            dados_especificos: occurrenceData.dados_especificos,
            desfecho_tipos: occurrenceData.desfecho_tipos,
            desfecho_principal: occurrenceData.desfecho_principal,
            desfecho_justificativa: occurrenceData.desfecho_justificativa,
            notificacao_orgao: occurrenceData.notificacao_orgao,
            notificacao_data: occurrenceData.notificacao_data,
            notificacao_responsavel: occurrenceData.notificacao_responsavel,
            medico_destino: occurrenceData.medico_destino,
            mensagem_medico: occurrenceData.mensagem_medico,
            mensagem_admin_medico: occurrenceData.mensagem_admin_medico,
            criado_em: occurrenceData.criado_em,
            criado_por: occurrenceData.criado_por,
            criado_por_nome: criadorNome,
            finalizado_em: new Date().toISOString(),
            finalizado_por: profile.id,
            pdf_url: pdfUrl,
            link: `${window.location.origin}/ocorrencias/${occurrenceData.id}`,
            anexos: attachments || [],
          };

          // Send to n8n webhook for finalization (direct fetch)
          fetch("https://n8n.imagoradiologia.cloud/webhook/finalizado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          }).then(res => {
            if (res.ok) {
              console.log("[n8n] Webhook de finalização enviado com sucesso");
            } else {
              console.error("[n8n] Webhook de finalização retornou erro:", res.status);
            }
          }).catch((err) => {
            console.error("[n8n] Erro no webhook de finalização:", err);
          });
        }
      }

      return { occurrenceId, newStatus };
    },
    onSuccess: ({ occurrenceId, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      queryClient.invalidateQueries({ queryKey: ["occurrence", occurrenceId] });
      queryClient.invalidateQueries({ queryKey: ["occurrence-stats"] });

      if (newStatus === "concluida") {
        toast({
          title: "Ocorrência concluída",
          description: "PDF gerado e salvo automaticamente.",
        });
      } else {
        toast({
          title: "Status atualizado",
          description: "O status da ocorrência foi alterado com sucesso.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Fetch occurrence statistics for dashboard
export function useOccurrenceStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["occurrence-stats", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occurrences")
        .select("status, triagem, tipo, subtipo, criado_em, dados_especificos");

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Filter revisao_exame occurrences (include legacy assistencial)
      const revisaoExameData = data.filter(o => o.subtipo === "revisao_exame" || o.tipo === "assistencial");

      // Count by exam type
      const byExamType: Record<string, number> = {};
      revisaoExameData.forEach(o => {
        const dados = o.dados_especificos as any;
        const modalidade = dados?.exameModalidade || "nao_informado";
        byExamType[modalidade] = (byExamType[modalidade] || 0) + 1;
      });

      // Count by doctor (médico responsável)
      const byDoctor: Record<string, number> = {};
      revisaoExameData.forEach(o => {
        const dados = o.dados_especificos as any;
        const medico = dados?.medicoResponsavel || "Não informado";
        byDoctor[medico] = (byDoctor[medico] || 0) + 1;
      });

      const stats = {
        total: data.length,
        pendentes: data.filter(o => o.status === "registrada" || o.status === "em_triagem").length,
        emAnalise: data.filter(o => o.status === "em_analise" || o.status === "acao_em_andamento").length,
        concluidas: data.filter(o => o.status === "concluida").length,
        improcedentes: data.filter(o => o.status === "improcedente").length,
        esteMes: data.filter(o => new Date(o.criado_em) >= thisMonth).length,
        byTriage: {
          circunstancia_risco: data.filter(o => o.triagem === "circunstancia_risco").length,
          near_miss: data.filter(o => o.triagem === "near_miss").length,
          incidente_sem_dano: data.filter(o => o.triagem === "incidente_sem_dano").length,
          evento_adverso: data.filter(o => o.triagem === "evento_adverso").length,
          evento_sentinela: data.filter(o => o.triagem === "evento_sentinela").length,
        },
        byType: {
          enfermagem: data.filter(o => (o.tipo as string) === "enfermagem").length,
          administrativa: data.filter(o => (o.tipo as string) === "administrativa").length,
          revisao_exame: data.filter(o => (o.tipo as string) === "revisao_exame" || (o.tipo as string) === "assistencial").length,
        },
        // New stats for revisao_exame
        revisaoExame: {
          total: revisaoExameData.length,
          byExamType,
          byDoctor,
        },
      };

      return stats;
    },
    enabled: !!profile?.tenant_id,
  });
}

// Fetch administrative occurrences
export function useAdministrativeOccurrences() {
  const { profile, role } = useAuth();

  return useQuery({
    queryKey: ["admin-occurrences", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("administrative_occurrences" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id && (role === 'admin' || role === 'rh'),
  });

}

// Fetch administrative occurrence statistics
export function useAdminOccurrenceStats() {
  const { profile, role } = useAuth();

  return useQuery({
    queryKey: ["admin-occurrence-stats", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("administrative_occurrences" as any)
        .select("status, created_at");

      if (error) throw error;

      const occurrences = data as any[] || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: occurrences.length,
        pendentes: occurrences.filter(o => o.status === "aberto" || o.status === "em_andamento").length,
        concluidas: occurrences.filter(o => o.status === "concluido").length,
        esteMes: occurrences.filter(o => new Date(o.created_at) >= thisMonth).length,
      };

      return stats;
    },
    enabled: !!profile?.tenant_id && (role === 'admin' || role === 'rh'),
  });
}

// Fetch all nursing occurrences
export function useNursingOccurrences() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["nursing-occurrences", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nursing_occurrences" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
}

// Create a new nursing occurrence
export function useCreateNursingOccurrence() {
  const queryClient = useQueryClient();
  const { profile, tenant } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateOccurrenceInput) => {
      if (!profile || !tenant) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("nursing_occurrences" as any)
        .insert({
          tenant_id: tenant.id,
          type: "enfermagem",
          subtype: input.subtipo,
          patient_name: input.paciente_nome_completo,
          patient_id: input.paciente_id,
          patient_birth_date: input.paciente_data_nascimento,
          occurrence_date: input.paciente_data_hora_evento,
          description: input.descricao_detalhada,
          specific_data: input.dados_especificos,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nursing-occurrences"] });
      toast({
        title: "Ocorrência de Enfermagem registrada",
        description: "A ocorrência foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar ocorrência",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
// Fetch nursing occurrence statistics
export function useNursingOccurrenceStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["nursing-occurrence-stats", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nursing_occurrences" as any)
        .select("status, subtype, created_at");

      if (error) throw error;

      const occurrences = data as any[] || [];
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: occurrences.length,
        pendentes: occurrences.filter(o => o.status === "registrada" || o.status === "em_analise").length,
        concluidas: occurrences.filter(o => o.status === "concluida").length,
        esteMes: occurrences.filter(o => new Date(o.created_at) >= thisMonth).length,
        bySubtype: {
          extravasamento: occurrences.filter(o => o.subtype === "extravasamento_enfermagem").length,
          reacao_adversa: occurrences.filter(o => o.subtype === "reacoes_adversas").length,
        }
      };

      return stats;
    },
    enabled: !!profile?.tenant_id,
  });
}

// Hook to fetch Patient Occurrences (from explicit patient_occurrences table)
export function usePatientOccurrencesList() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['patient-occurrences-list', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_occurrences' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map to a common interface format so the UI can display it
      return data.map((item: any) => ({
        id: item.id,
        tipo: 'paciente',
        subtipo: null,
        status: item.status, // e.g. 'pendente'
        criado_em: item.created_at,
        descricao_detalhada: item.description,
        paciente_nome_completo: item.patient_name || (item.is_anonymous ? 'Anônimo' : 'Não informado'),
        paciente_telefone: item.patient_phone,
        protocolo: item.protocol,
        criado_por: null, // anonymous
      }));
    },
    enabled: !!profile
  });
}
