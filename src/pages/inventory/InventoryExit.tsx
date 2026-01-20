import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useInventory, InventoryProduct } from "@/hooks/useInventory";
import { MovementDialog } from "./MovementDialog";
import { Search, ArrowDownCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InventoryExit() {
    const { products, isLoading } = useInventory();
    const [searchTerm, setSearchTerm] = useState("");
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMovement = (product: InventoryProduct) => {
        setSelectedProduct(product);
        setIsMovementOpen(true);
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-destructive">Saída de Estoque</h1>
                        <p className="text-muted-foreground mt-1">
                            Selecine um produto para dar baixa.
                        </p>
                    </div>
                    {/* Optional: Global Exit Button if they want to scan/select without searching list first? 
                        User said "aparecer a lista dos produtos e a função dar baixa".
                    */}
                </div>

                <div className="rounded-xl border border-border bg-card">
                    <div className="p-6">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="relative w-full">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar produtos para baixa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 text-lg py-6" // Larger for tablet touch
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Produto</TableHead>
                                        <TableHead>Qtd Atual</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                Nenhum produto encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts?.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-base">{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">{product.category}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={product.quantity <= product.min_stock_level ? "destructive" : "secondary"}>
                                                        {product.quantity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleMovement(product)}
                                                        className="h-10 px-4" // Larger touch target
                                                    >
                                                        <ArrowDownCircle className="mr-2 h-4 w-4" />
                                                        Baixa
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <MovementDialog
                    product={selectedProduct}
                    products={products}
                    isOpen={isMovementOpen}
                    onClose={() => setIsMovementOpen(false)}
                />
            </div>
        </MainLayout>
    );
}
