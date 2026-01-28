import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { OccurrenceStatus, TriageClassification, OutcomeType } from "@/types/occurrence";

// Unified type for the Frontend Dashboard
export interface UnifiedOccurrence {
  id: string;
  protocolo: string;
  tipo: string; // Allow string to accept all mapped types
  subtipo?: string;
  status: string;
  descricao: string;
  criado_em: string;
  criado_por?: string;

  // Normalized fields for UI display
  paciente_nome?: string;
  paciente_id?: string;
  triagem?: string;

  original_table: string;
  raw_data: any;
}

export type DbOccurrence = any;

// =========================================================
// UNIFIED HOOK (Merges separate tables)
// =========================================================
// UNIFIED HOOK (Merges separate tables)
// =========================================================
export function useOccurrences() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || '00000000-0000-0000-0000-000000000000';

  return useQuery({
    queryKey: ["occurrences-unified", tenantId],
    queryFn: async () => {
      // Fetch all tables in parallel
      const [admRes, enfRes, laudoRes, pacRes, livreRes] = await Promise.all([
        supabase.from("ocorrencia_adm" as any).select("*").eq('tenant_id', tenantId).order("criado_em", { ascending: false }),
        supabase.from("ocorrencia_enf" as any).select("*").eq('tenant_id', tenantId).order("criado_em", { ascending: false }),
        supabase.from("ocorrencia_laudo" as any).select("*").eq('tenant_id', tenantId).order("criado_em", { ascending: false }),
        supabase.from("ocorrencia_paciente" as any).select("*").eq('tenant_id', tenantId).order("criado_em", { ascending: false }),
        supabase.from("ocorrencia_livre" as any).select("*").eq('tenant_id', tenantId).order("criado_em", { ascending: false }),
      ]);

      if (admRes.error) throw admRes.error;
      if (enfRes.error) throw enfRes.error;
      if (laudoRes.error) throw laudoRes.error;
      if (pacRes.error) throw pacRes.error;
      if (livreRes.error) throw livreRes.error;

      // Normalize Admin
      const administrative = (admRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'administrativa' as const,
        subtipo: item.categoria || item.subtype, // Updated specific field
        status: item.status,
        descricao: item.descricao,
        criado_em: item.created_at || item.criado_em,
        criado_por: item.criado_por || item.user_id,
        paciente_nome: item.paciente_nome_completo, // Direct map
        paciente_id: item.paciente_id,
        original_table: 'ocorrencia_adm',
        raw_data: item
      }));

      // Normalize Enf
      const nursing = (enfRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'enfermagem' as const,
        subtipo: item.tipo_incidente,
        status: item.status,
        descricao: item.descricao_detalhada,
        criado_em: item.criado_em,
        criado_por: item.criado_por,
        paciente_nome: item.paciente_nome,
        paciente_id: item.paciente_prontuario,
        original_table: 'ocorrencia_enf',
        raw_data: item
      }));

      // Normalize Laudo
      const laudo = (laudoRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'revisao_exame' as const,
        subtipo: 'revisao_exame',
        status: item.status,
        // Map Description from Motivo Revisao since Descricao Detalhada doesn't exist
        descricao: item.motivo_revisao === 'Outro' && item.motivo_revisao_outro
          ? `Outro Monitoramento: ${item.motivo_revisao_outro}`
          : item.motivo_revisao || "Solicitação de Revisão",

        criado_em: item.criado_em,
        criado_por: item.criado_por,
        paciente_nome: item.paciente_nome,
        original_table: 'ocorrencia_laudo',
        raw_data: item
      }));

      // Normalize Paciente
      const paciente = (pacRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'paciente' as const,
        subtipo: item.subtipo,
        status: item.status,
        descricao: item.relato_paciente || "Sem relato",
        criado_em: item.criado_em,
        criado_por: item.criado_por,
        paciente_nome: item.paciente_nome,
        original_table: 'ocorrencia_paciente',
        raw_data: item
      }));

      // Normalize Livre
      const livre = (livreRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'livre' as const,
        subtipo: item.subtipo,
        status: item.status,
        descricao: item.descricao || item.titulo,
        criado_em: item.criado_em,
        criado_por: item.criado_por,
        paciente_nome: item.paciente_nome || "N/A", // Optional in Livre
        original_table: 'ocorrencia_livre',
        raw_data: item
      }));

      const combined = [...administrative, ...nursing, ...laudo, ...paciente, ...livre];
      return combined.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()) as UnifiedOccurrence[];
    },
    enabled: !!tenantId,
  });
}

// =========================================================
// SINGLE OCCURRENCE HOOK (Searches all tables)
// =========================================================
export function useOccurrence(id: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["occurrence-unified", id],
    queryFn: async () => {
      if (!id) return null;

      // Try searching in all 3 tables 
      // This is inefficient but necessary given the separation without a unified ID index
      // Alternatively, we could query based on the 'type' if passed, but useOccurrence usually just has ID.

      const tables = ['ocorrencia_adm', 'ocorrencia_enf', 'ocorrencia_laudo', 'ocorrencia_paciente', 'ocorrencia_livre'];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table as any)
          .select("*")
          .eq('id', id)
          .maybeSingle();

        if (data) {
          return { ...(data as object), original_table: table } as any;
        }
      }

      return null;
    },
    enabled: !!id && !!profile?.tenant_id
  });
}


// =========================================================
// SPECIFIC HOOKS
// =========================================================

export function useAdministrativeOccurrences() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["admin-occurrences-new", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocorrencia_adm" as any)
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useNursingOccurrences() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["nursing-occurrences-new", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocorrencia_enf" as any)
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });
}

export function useMedicalOccurrences() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ["medical-occurrences-new", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ocorrencia_laudo" as any)
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });
}

// =========================================================
// PLACEHOLDER HOOKS (To prevent UI crashes temporarily)
// =========================================================

export function usePatientOccurrencesList() {
  return useQuery({ queryKey: ['empty-patient'], queryFn: () => [] });
}

export function useOccurrenceStats() {
  return useQuery({ queryKey: ['empty-stats'], queryFn: () => ({}) });
}

export function useAdminOccurrenceStats() {
  return useQuery({ queryKey: ['empty-admin-stats'], queryFn: () => ({}) });
}

export function useNursingOccurrenceStats() {
  return useQuery({ queryKey: ['empty-nursing-stats'], queryFn: () => ({}) });
}

export function useUpdateOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, original_table, ...updates }: { id: string; original_table: string;[key: string]: any }) => {
      if (!original_table) throw new Error("Original table required for update");

      const { error } = await supabase
        .from(original_table as any)
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["occurrence-unified"] });
      toast({ title: "Ocorrência atualizada com sucesso" });
    },
    onError: (err) => toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" })
  });
}

export function useUpdateOccurrenceStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, original_table }: { id: string; status: string; original_table: string }) => {
      if (!original_table) throw new Error("Original table required for update");

      const { error } = await supabase
        .from(original_table as any)
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["occurrence-unified"] });
      toast({ title: "Status atualizado" });
    },
    onError: (err) => toast({ title: "Erro ao atualizar status", description: err.message, variant: "destructive" })
  });
}


export function useCreateOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Helper date function
  const convertToDbDate = (date: string) => {
    if (!date) return null;
    return new Date(date).toISOString();
  };

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      // Handle flat structure from NovaOcorrenciaForm
      const paciente = data.paciente || {
        nomeCompleto: data.paciente_nome_completo,
        telefone: data.paciente_telefone,
        idPaciente: data.paciente_id,
        tipoExame: data.paciente_tipo_exame,
        dataHoraEvento: data.paciente_data_hora_evento,
        cpf: data.paciente_cpf,
        sexo: data.paciente_sexo,
        unidadeLocal: data.paciente_unidade_local
      };

      // Administrative
      if (data.tipo === 'administrativa') {
        const payload = {
          tenant_id: profile.tenant_id,
          criado_por: profile.id,
          titulo: `Ocorrência Administrativa - ${data.subtipo}`,
          descricao_detalhada: data.descricao_detalhada || JSON.stringify(data.dados_especificos || {}),
          subtipo: data.subtipo || "Geral",
          prioridade: "media",
          status: "pendente",

          // Patient Data (Now supported in ocorrencia_adm)
          paciente_nome: paciente.nomeCompleto,
          // paciente_unidade_local REMOVED from root, not in table
          paciente_cpf: paciente.cpf, // Added CPF support to Adm table logic if passed
          // paciente_id REMOVED/MAPPED - ocorrencia_adm doesn't link to patient ID usually, but has strings
          // paciente_tipo_exame REMOVED from root
          paciente_telefone: paciente.telefone,
          paciente_data_nascimento: convertToDbDate(paciente.dataNascimento),

          dados_adicionais: {
            unidade: data.unidadeLocal || paciente.unidadeLocal,
            tipoExame: paciente.tipoExame,
            ...(data.dados_especificos || data.dadosEspecificos)
          }
        };

        const { data: res, error } = await (supabase
          .from("ocorrencia_adm" as any) as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return res;
      }

      // Medical / Laudo (revisao_exame)
      if (data.tipo === 'revisao_exame' || data.subtipo === 'revisao_exame' || data.tipo === 'assistencial') {
        const payload = {
          tenant_id: profile.tenant_id,
          criado_por: profile.id,

          // Core Identity
          tipo: 'revisao_exame',
          subtipo: 'revisao_exame',
          status: 'aguardando_envio', // Initial status

          // Patient Snapshot (Mapeamento explícito)
          paciente_nome: paciente.nomeCompleto,
          paciente_id: paciente.idPaciente,
          // paciente_sexo: paciente.sexo, // REMOVED - Not in schema
          paciente_cpf: paciente.cpf,
          paciente_data_nascimento: convertToDbDate(paciente.dataNascimento),
          paciente_telefone: paciente.telefone,

          // Exam Data
          exame_tipo: paciente.tipoExame || "Não informado",
          exame_regiao: data.dadosEspecificos?.exameRegiao,
          exame_data: data.dadosEspecificos?.exameData ? convertToDbDate(data.dadosEspecificos.exameData) : (paciente.dataHoraEvento ? convertToDbDate(paciente.dataHoraEvento) : null),
          exame_unidade: data.unidadeLocal || data.paciente?.unidadeLocal || paciente.unidadeLocal,

          // Doctor & Report
          medico_responsavel_laudo: data.dadosEspecificos?.medicoResponsavelId, // Assuming select returns name or we store ID
          medico_responsavel_laudo_id: data.dadosEspecificos?.medicoResponsavelId,
          laudo_entregue: data.dadosEspecificos?.laudoEntregue === 'sim',

          // Review Details
          motivo_revisao: data.dadosEspecificos?.motivoRevisao || "Outro",
          motivo_revisao_outro: data.dadosEspecificos?.motivoRevisaoOutro,
          tipo_discrepancia: data.dadosEspecificos?.tipoDiscrepancia,

          // Actions
          acao_tomada: data.dadosEspecificos?.acaoTomada,
          pessoas_comunicadas: data.dadosEspecificos?.pessoasComunicadas,

          // Legacy/Flex Field
          dados_adicionais: data.dadosEspecificos || {}
        };

        const { data: res, error } = await (supabase
          .from("ocorrencia_laudo" as any) as any)
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error("Error creating laudo occurrence:", error);
          throw error;
        }
        return res;
      }

      // Generic Fallback - now maps to Administrative (General) instead of broken table
      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        titulo: `Ocorrência Geral`,
        descricao: data.descricao_detalhada || JSON.stringify(data.dados_especificos || {}),
        categoria: "Geral",
        prioridade: "baixa",
        status: "pendente",
        dados_especificos: data.dados_especificos
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_adm" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["medical-occurrences-new"] });
      toast({ title: "Ocorrência criada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

// =========================================================
// CREATION HOOKS
// =========================================================

export function useCreateAdminOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        titulo: data.titulo,
        descricao: data.descricao,
        categoria: data.categoria || "Geral",
        prioridade: data.prioridade || "media",
        status: "pendente"
      };

      // Explicit cast to any to bypass TS check if type definitions aren't fully up to date yet
      const { data: res, error } = await (supabase
        .from("ocorrencia_adm" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["admin-occurrences-new"] });
      toast({ title: "Ocorrência Administrativa criada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

export function useCreateNursingOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      // Support flat structure from NovaOcorrenciaForm (backward compatibility)
      const pacienteName = data.paciente?.nomeCompleto || data.paciente_nome_completo;
      const pacienteId = data.paciente?.idPaciente || data.paciente_id || data.paciente_prontuario;
      const incidentDate = data.paciente?.dataHoraEvento || data.paciente_data_hora_evento || new Date().toISOString();

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        tipo_incidente: data.subtipo || "Geral",
        descricao_detalhada: data.descricao_detalhada || data.descricao || (data.dados_especificos ? JSON.stringify(data.dados_especificos) : ""),

        // Patient Data
        paciente_nome: pacienteName,
        paciente_cpf: data.paciente?.cpf || data.paciente_cpf,
        paciente_unidade_local: data.paciente_unidade_local || data.paciente?.unidadeLocal || data.unidadeLocal,
        paciente_telefone: data.paciente_telefone || data.paciente?.telefone,
        // Convert DD/MM/YYYY if needed (helper not in scope here but simple split works if standard string)
        paciente_data_nascimento: data.paciente_data_nascimento || (data.paciente?.dataNascimento ? new Date(data.paciente.dataNascimento.split('/').reverse().join('-')).toISOString().split('T')[0] : null),

        paciente_data_hora_evento: incidentDate,
        conduta: data.conduta || data.dados_especificos?.conduta || data.dadosEspecificos?.conduta,
        status: "registrada"
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_enf" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["nursing-occurrences-new"] });
      toast({ title: "Ocorrência de Enfermagem criada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

export function useCreateMedicalOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        paciente_nome: data.paciente?.nomeCompleto,
        paciente_id: data.paciente?.idPaciente,
        paciente_sexo: data.paciente?.sexo,
        exame_tipo: data.paciente?.tipoExame || "Geral",
        data_exame: data.paciente?.dataHoraEvento ? new Date(data.paciente.dataHoraEvento).toISOString().split('T')[0] : null,
        motivo_revisao: data.motivo || "Revisão",
        descricao_solicitacao: data.descricao,
        prioridade: "rotina",
        status: "pendente",
        dados_especificos: data.dadosEspecificos || {} // Add generic jsonb if needed
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_laudo" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      queryClient.invalidateQueries({ queryKey: ["medical-occurrences-new"] });
      toast({ title: "Solicitação de Revisão criada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

export function useCreateGenericOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        titulo: "Ocorrência Geral",
        categoria: "Geral",
        descricao: data.descricao,
        status: "pendente",
        // Map as much as possible to admin table
        prioridade: "baixa"
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_adm" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      toast({ title: "Ocorrência criada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

export function useCreatePatientOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,

        tipo: 'paciente',
        subtipo: data.subtipo || 'elogio',

        // Patient Info
        paciente_nome: data.paciente?.nomeCompleto,
        paciente_cpf: data.paciente?.cpf,
        paciente_telefone: data.paciente?.telefone,
        paciente_data_nascimento: data.paciente?.dataNascimento ? new Date(data.paciente.dataNascimento.split('/').reverse().join('-')).toISOString().split('T')[0] : null,

        // Details
        relato_paciente: data.descricao_detalhada || data.descricao || (data.dados_especificos ? JSON.stringify(data.dados_especificos) : ""),
        area_envolvida: data.dados_especificos?.areaEnvolvida,
        classificacao: data.dados_especificos?.classificacao,

        status: "registrada",
        dados_adicionais: data.dados_especificos
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_paciente" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      toast({ title: "Ocorrência do Paciente registrada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}

export function useCreateFreeOccurrence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,

        tipo: 'livre',
        subtipo: data.subtipo,
        titulo: data.titulo || `Ocorrência Livre - ${data.subtipo}`,
        descricao: data.descricao || data.descricao_detalhada || (data.dados_especificos ? JSON.stringify(data.dados_especificos) : "Sem descrição"),

        // Optional Patient Info
        paciente_nome: data.paciente?.nomeCompleto,

        status: "registrada",
        dados_adicionais: data.dados_especificos
      };

      const { data: res, error } = await (supabase
        .from("ocorrencia_livre" as any) as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occurrences-unified"] });
      toast({ title: "Ocorrência Livre registrada" });
      navigate("/ocorrencias");
    },
    onError: (err) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" })
  });
}
