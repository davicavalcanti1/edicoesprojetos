import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useMutation({
    mutationFn: async (data: any) => {
      console.warn("Update not implemented for unified hook yet.", data);
      throw new Error("Update not implemented");
    },
    onError: () => toast({ title: "Erro", description: "Not implemented in refactor" })
  });
}

export function useUpdateOccurrenceStatus() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      console.warn("Update Status not implemented for unified hook yet.", data);
      throw new Error("Update Status not implemented");
    },
    onError: () => toast({ title: "Erro", description: "Not implemented in refactor" })
  });
}

export function useCreateOccurrence() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => { throw new Error("Use specific create hooks: useCreateAdminOccurrence, etc.") },
    onError: () => toast({ title: "Erro", description: "Use specific forms" })
  });
}

export function useCreateNursingOccurrence() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => { throw new Error("Use specific create hooks for Enf") },
    onError: () => toast({ title: "Erro", description: "Not implemented in refactor" })
  });
}
