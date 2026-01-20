import { MainLayout } from "@/components/layout/MainLayout";
import { ProductForm } from "./ProductForm";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function InventoryNew() {
    const { toast } = useToast();
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Novo Produto</h1>
                    <p className="text-muted-foreground mt-1">
                        Formulário exclusivo para cadastro de novos itens.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <ProductForm
                        onSuccess={() => {
                            toast({
                                title: "Produto criado!",
                                description: "O produto foi adicionado ao estoque.",
                            });
                            // Optionally keep it open for multiple entries or navigate back
                            // User said "só o formulário... ativo num tablet", implies continuous entry.
                            // I will just show toast and clear form (which logic handles if key changes, but ProductForm resets on success? No, it doesn't automatically reset unless we tell it or re-mount.
                            // Looking at ProductForm, it calls onSuccess. I should probably force a reset or reload.
                            // Actually ProductForm depends on `product` prop. If I want to clear it, I might need to remount it.
                            window.location.reload(); // Simple way to reset for next entry on a tablet stand
                        }}
                        onCancel={() => navigate("/estoque")}
                    />
                </div>
            </div>
        </MainLayout>
    );
}
