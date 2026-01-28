import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Doctor {
    id: string;
    nome: string;
    crm?: string;
    ativo: boolean;
}

export interface Employee {
    id: string;
    nome: string;
    cargo?: string;
    ativo: boolean;
}

export function useDoctors() {
    return useQuery({
        queryKey: ["doctors"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("medicos" as any)
                .select("*")
                .eq("ativo", true)
                .order("nome");

            if (error) throw error;
            return (data || []) as unknown as Doctor[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useEmployees(role?: string) {
    return useQuery({
        queryKey: ["employees", role],
        queryFn: async () => {
            let query = supabase
                .from("employees" as any)
                .select("*")
                .eq("ativo", true)
                .order("nome");

            if (role) {
                query = query.eq("cargo", role);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data || []) as unknown as Employee[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
