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

// =========================================================
// UNIFIED HOOK (Merges separate tables)
// =========================================================
export function useOccurrences() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["occurrences-unified", profile?.tenant_id],
    queryFn: async () => {
      // Fetch 4 tables in parallel (Admin, Enf, Laudo, and General/Patient)
      const [admRes, enfRes, laudoRes, generalRes] = await Promise.all([
        supabase.from("ocorrencias_adm" as any).select("*").order("criado_em", { ascending: false }),
        supabase.from("ocorrencias_enf" as any).select("*").order("criado_em", { ascending: false }),
        supabase.from("ocorrencias_laudo" as any).select("*").order("criado_em", { ascending: false }),
        supabase.from("occurrences").select("*").order("criado_em", { ascending: false }),
      ]);

      if (admRes.error) throw admRes.error;
      if (enfRes.error) throw enfRes.error;
      if (laudoRes.error) throw laudoRes.error;
      if (generalRes.error) throw generalRes.error;

      // Normalize Admin
      const administrative = (admRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'administrativa' as const,
        subtipo: item.categoria,
        status: item.status,
        descricao: item.descricao,
        criado_em: item.criado_em,
        criado_por: item.criado_por,
        original_table: 'ocorrencias_adm',
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
        original_table: 'ocorrencias_enf',
        raw_data: item
      }));

      // Normalize Laudo
      const laudo = (laudoRes.data || []).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        tipo: 'revisao_exame' as const,
        subtipo: 'revisao_exame',
        status: item.status,
        descricao: item.descricao_solicitacao,
        criado_em: item.criado_em,
        criado_por: item.criado_por,
        paciente_nome: item.paciente_nome,
        original_table: 'ocorrencias_laudo',
        raw_data: item
      }));

      // Normalize General (Patient/Livre)
      const general = (generalRes.data || []).map((item: any) => ({
        ...item,
        original_table: 'occurrences',
        raw_data: item
      }));

      const combined = [...administrative, ...nursing, ...laudo, ...general];
      return combined.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()) as UnifiedOccurrence[];
    },
    enabled: !!profile?.tenant_id,
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

      const tables = ['ocorrencias_adm', 'ocorrencias_enf', 'ocorrencias_laudo'];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table as any)
          .select("*")
          .eq('id', id)
          .maybeSingle();

        if (data) {
          return { ...data, original_table: table } as any;
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
        .from("ocorrencias_adm" as any)
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
        .from("ocorrencias_enf" as any)
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
        .from("ocorrencias_laudo" as any)
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

  return useMutation({
    mutationFn: async (data: any) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error("Missing profile info");

      // Handle flat structure from NovaOcorrenciaForm
      const paciente = data.paciente || {
        nomeCompleto: data.paciente_nome_completo,
        telefone: data.paciente_telefone,
        idPaciente: data.paciente_id,
        tipoExame: data.paciente_tipo_exame,
        dataHoraEvento: data.paciente_data_hora_evento
      };

      // Administrative
      if (data.tipo === 'administrativa') {
        const payload = {
          tenant_id: profile.tenant_id,
          criado_por: profile.id,
          titulo: `Ocorrência Administrativa - ${data.subtipo}`,
          descricao: data.descricao_detalhada || JSON.stringify(data.dados_especificos || {}),
          categoria: data.subtipo || "Geral",
          prioridade: "media",
          status: "pendente"
        };

        const { data: res, error } = await (supabase
          .from("ocorrencias_adm" as any) as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return res;
      }

      // Medical / Laudo (revisao_exame)
      if (data.tipo === 'revisao_exame') {
        const payload = {
          tenant_id: profile.tenant_id,
          criado_por: profile.id,
          paciente_nome: paciente.nomeCompleto,
          exame_tipo: paciente.tipoExame || "Geral",
          data_exame: paciente.dataHoraEvento ? new Date(paciente.dataHoraEvento).toISOString().split('T')[0] : null,
          motivo_revisao: (data.dados_especificos as any)?.motivoRevisao || "Revisão",
          descricao_solicitacao: data.descricao_detalhada || JSON.stringify(data.dados_especificos || {}),
          prioridade: "rotina",
          status: "pendente",
          // public_token: ... // Generated by trigger or optional
        };

        const { data: res, error } = await (supabase
          .from("ocorrencias_laudo" as any) as any)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return res;
      }

      // Generic Fallback (Livre, Paciente, etc) - goes to 'occurrences' table
      const payload = {
        tenant_id: profile.tenant_id,
        criado_por: profile.id,
        tipo: data.tipo || 'livre',
        subtipo: data.subtipo || 'geral',
        descricao: data.descricao_detalhada || JSON.stringify(data.dados_especificos || {}),
        status: "registrada",
        paciente_info: paciente,
        dados_especificos: data.dados_especificos
      };

      const { data: res, error } = await (supabase
        .from("occurrences" as any) as any)
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

      const { data: res, error } = await (supabase
        .from("ocorrencias_adm" as any) as any)
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
        descricao_detalhada: data.descricao_detalhada || data.descricao,
        paciente_nome: pacienteName,
        paciente_prontuario: pacienteId,
        data_incidente: incidentDate,
        conduta_tomada: data.conduta,
        status: "registrada"
      };

      const { data: res, error } = await (supabase
        .from("ocorrencias_enf" as any) as any)
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
        exame_tipo: data.paciente?.tipoExame || "Geral",
        data_exame: data.paciente?.dataHoraEvento ? new Date(data.paciente.dataHoraEvento).toISOString().split('T')[0] : null,
        motivo_revisao: data.motivo || "Revisão",
        descricao_solicitacao: data.descricao,
        prioridade: "rotina",
        status: "pendente",
        dados_especificos: data.dadosEspecificos || {} // Add generic jsonb if needed
      };

      const { data: res, error } = await (supabase
        .from("ocorrencias_laudo" as any) as any)
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
        tipo: data.tipo || 'livre',
        subtipo: data.subtipo || 'geral',
        descricao: data.descricao,
        status: "registrada",
        paciente_info: data.paciente
      };

      const { data: res, error } = await (supabase
        .from("occurrences" as any) as any)
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
