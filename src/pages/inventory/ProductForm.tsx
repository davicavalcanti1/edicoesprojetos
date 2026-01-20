import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useInventory, InventoryProduct } from "@/hooks/useInventory";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const productSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
    price: z.coerce.number().min(0, "Preço não pode ser negativo"),
    min_stock_level: z.coerce.number().min(0).default(5),
    category: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: InventoryProduct | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const { createProduct, updateProduct, deleteProduct } = useInventory();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            quantity: 0,
            price: 0,
            min_stock_level: 5,
            category: "",
        },
    });

    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                quantity: product.quantity,
                price: product.price,
                min_stock_level: product.min_stock_level || 5,
                category: product.category || "",
            });
        } else {
            form.reset({
                name: "",
                quantity: 0,
                price: 0,
                min_stock_level: 5,
                category: "",
            });
        }
    }, [product, form]);

    const onSubmit = async (data: ProductFormValues) => {
        try {
            if (product) {
                await updateProduct.mutateAsync({ id: product.id, ...data });
            } else {
                await createProduct.mutateAsync(data);
            }
            onSuccess();
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDelete = async () => {
        if (product && confirm("Tem certeza que deseja excluir este produto?")) {
            await deleteProduct.mutateAsync(product.id);
            onSuccess();
        }
    };

    const isSubmitting = createProduct.isPending || updateProduct.isPending;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Seringa 20ml" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Descartáveis" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="min_stock_level"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estoque Mínimo</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço Unitário (R$)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-between pt-4">
                    {product && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleteProduct.isPending}>
                            Excluir
                        </Button>
                    )}
                    <div className={`flex gap-2 ${!product ? 'w-full justify-end' : ''}`}>
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {product ? "Salvar" : "Criar"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
