import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { InventoryProduct, useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";

const movementSchema = z.object({
    type: z.enum(["IN", "OUT"]),
    quantity: z.coerce.number().min(1, "Quantidade deve ser maior que zero"),
    sector_id: z.string().optional(),
    reason: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

interface MovementDialogProps {
    product: InventoryProduct | null;
    isOpen: boolean;
    onClose: () => void;
}

export function MovementDialog({ product, products, isOpen, onClose }: { product: InventoryProduct | null, products?: InventoryProduct[], isOpen: boolean, onClose: () => void }) {
    const { registerMovement } = useInventory();
    const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    // Determine target product: either passed prop or selected from list
    const targetProduct = product || products?.find(p => p.id === selectedProductId);

    const form = useForm<MovementFormValues>({
        resolver: zodResolver(movementSchema),
        defaultValues: {
            type: "OUT",
            quantity: 1,
            reason: "",
        },
    });

    const type = form.watch("type");

    useEffect(() => {
        if (isOpen) {
            fetchSectors();
            form.reset({
                type: "OUT",
                quantity: 1,
                reason: "",
            });
            setSelectedProductId("");
        }
    }, [isOpen]);

    const fetchSectors = async () => {
        setIsLoadingSectors(true);
        const { data } = await (supabase as any).from("inventory_sectors").select("*").order("name");
        if (data) setSectors(data);
        setIsLoadingSectors(false);
    };

    const onSubmit = async (values: MovementFormValues) => {
        if (!targetProduct) {
            form.setError("root", { message: "Selecione um produto" });
            return;
        }

        if (values.type === "OUT" && targetProduct.quantity < values.quantity) {
            form.setError("quantity", {
                type: "manual",
                message: `Estoque insuficiente. Disponível: ${targetProduct.quantity}`,
            });
            return;
        }

        if (values.type === "OUT" && !values.sector_id) {
            form.setError("sector_id", {
                type: "manual",
                message: "Selecione o setor de destino",
            });
            return;
        }

        try {
            await registerMovement.mutateAsync({
                product_id: targetProduct.id,
                ...values,
            });
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Movimentação de Estoque
                        {targetProduct && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                {targetProduct.name}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Registre entrada ou saída de produtos.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {!product && (
                            <FormItem>
                                <FormLabel>Produto</FormLabel>
                                <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um produto..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {products?.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="IN">
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <ArrowUpCircle className="h-4 w-4" />
                                                        Entrada
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="OUT">
                                                    <div className="flex items-center gap-2 text-rose-600">
                                                        <ArrowDownCircle className="h-4 w-4" />
                                                        Saída
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantidade</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {type === "OUT" && (
                            <FormField
                                control={form.control}
                                name="sector_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Setor de Destino</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o setor..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sectors.map((sector) => (
                                                    <SelectItem key={sector.id} value={sector.id}>
                                                        {sector.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observação (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Motivo, responsável, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={registerMovement.isPending || (!product && !selectedProductId)}
                                className={type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
                            >
                                {registerMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {type === "IN" ? "Registrar Entrada" : "Dar Baixa"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
