import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InventoryProduct {
    id: string;
    name: string;
    quantity: number;
    price: number;
    min_stock_level: number;
    description?: string;
    category?: string;
    updated_at?: string;
}

export function useInventory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({
        queryKey: ["inventory_products"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("inventory_products")
                .select("*")
                .order("name");

            if (error) throw error;
            return data as InventoryProduct[];
        },
    });

    const createProduct = useMutation({
        mutationFn: async (product: Omit<InventoryProduct, "id" | "updated_at">) => {
            // Get the tenant_id from the current session or assume RLS handles it if default func uses auth.uid()
            // But usually we need to insert tenant_id explicitly if not handled by db trigger/default
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // We need to fetch the tenant_id for the user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) throw new Error("No tenant found for user");

            const { data, error } = await (supabase as any)
                .from("inventory_products")
                .insert([{ ...product, tenant_id: profile.tenant_id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            toast({
                title: "Produto criado",
                description: "O produto foi adicionado ao estoque com sucesso.",
            });
        },
        onError: (error) => {
            console.error("Error creating product:", error);
            toast({
                variant: "destructive",
                title: "Erro ao criar produto",
                description: "Não foi possível adicionar o produto.",
            });
        },
    });

    const updateProduct = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<InventoryProduct> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("inventory_products")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            toast({
                title: "Produto atualizado",
                description: "As informações do produto foram salvas.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: "Não foi possível salvar as alterações.",
            });
        },
    });

    const deleteProduct = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("inventory_products")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            toast({
                title: "Produto removido",
                description: "O produto foi excluído do estoque.",
            });
        },
    });

    const registerMovement = useMutation({
        mutationFn: async (data: { product_id: string; type: "IN" | "OUT"; quantity: number; sector_id?: string; reason?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) throw new Error("No tenant found");

            const { error } = await (supabase as any)
                .from("inventory_movements")
                .insert([{
                    ...data,
                    tenant_id: profile.tenant_id,
                    user_id: user.id
                }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-movements"] }); // Invalidate movements too
            toast({ title: "Movimentação registrada com sucesso" });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao registrar movimentação",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const deleteMovement = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("inventory_movements")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
            toast({
                title: "Movimentação excluída",
                description: "O registro foi removido e o estoque atualizado.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover a movimentação.",
            });
        }
    });

    const updateMovement = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string, quantity?: number, type?: "IN" | "OUT", reason?: string, sector_id?: string }) => {
            const { error } = await (supabase as any)
                .from("inventory_movements")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory_products"] });
            queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
            toast({
                title: "Movimentação atualizada",
                description: "O registro foi alterado e o estoque recalculado.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar",
                description: "Não foi possível atualizar a movimentação.",
            });
        }
    });

    return {
        products,
        isLoading,
        createProduct,
        updateProduct,
        deleteProduct,
        registerMovement,
        deleteMovement,
        updateMovement
    };
}
