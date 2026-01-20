import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface BookEntry {
    id: string;
    sector: 'administrativo' | 'enfermagem';
    content: string;
    created_at: string;
    created_by: string;
    page_number: number;
    created_by_name?: string; // joined
}

export function useOccurrenceBook(sector?: 'administrativo' | 'enfermagem') {
    const { profile } = useAuth();

    return useQuery({
        queryKey: ['occurrence-book', sector, profile?.tenant_id],
        queryFn: async () => {
            // 1. Fetch entries
            let query = supabase
                .from('occurrence_book_entries' as any)
                .select('*')
                .order('page_number', { ascending: true }); // Book order

            if (sector) {
                query = query.eq('sector', sector);
            }

            const { data: entries, error } = await query;
            if (error) throw error;

            // 2. Extract Creator IDs
            const creatorIds = [...new Set((entries || []).map((e: any) => e.created_by).filter(Boolean))];

            // 3. Fetch Profiles for Creators using standard public.profiles table
            let creatorMap: Record<string, string> = {};
            if (creatorIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', creatorIds);

                if (profiles) {
                    creatorMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {});
                }
            }

            // 4. Map names
            return (entries || []).map((item: any) => ({
                ...item,
                created_by_name: creatorMap[item.created_by] || 'Desconhecido'
            })) as BookEntry[];
        },
        enabled: !!profile
    });
}

export function useCreateBookEntry() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ content, sector }: { content: string, sector: 'administrativo' | 'enfermagem' }) => {
            if (!profile) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from('occurrence_book_entries' as any)
                .insert({
                    content,
                    sector,
                    created_by: profile.id,
                    tenant_id: profile.tenant_id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['occurrence-book'] });
            toast({ title: "Registro adicionado ao livro com sucesso" });
        },
        onError: (err) => {
            toast({ title: "Erro ao registrar", description: err.message, variant: "destructive" });
        }
    });
}
