import {
    Package,
    TrendingUp,
    AlertCircle,
    DollarSign,
    Plus,
    Search,
    Filter
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { useInventory, InventoryProduct } from "@/hooks/useInventory";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductForm } from "./ProductForm";
import { MovementDialog } from "./MovementDialog";
import { InventoryReports } from "./InventoryReports";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryDashboard() {
    const { products, isLoading } = useInventory();
    const { role } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

    // RBAC
    const canManage = role === 'estoque';
    const canEdit = role === 'estoque' || role === 'admin';

    // Stats Calculation
    const totalProducts = products?.length || 0;
    const totalValue = products?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0;
    const lowStockCount = products?.filter(p => p.quantity <= p.min_stock_level).length || 0;

    const chartData = products?.map(p => ({
        name: p.name,
        value: p.price * p.quantity,
        quantity: p.quantity
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const filteredProducts = products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product: InventoryProduct) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleMovement = (product: InventoryProduct) => {
        setSelectedProduct(product);
        setIsMovementOpen(true);
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-primary">Controle de Estoque</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie produtos, entradas e saídas.
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex gap-2">
                            <Button onClick={() => { setSelectedProduct(null); setIsMovementOpen(true); }} variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-200">
                                <ArrowDownCircle className="mr-2 h-4 w-4" />
                                Dar Saída
                            </Button>
                            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Produto
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="reports">Relatórios & Histórico</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium">Total de Produtos</h3>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">{totalProducts}</div>
                                <p className="text-xs text-muted-foreground mt-1">Itens cadastrados</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium">Valor em Estoque</h3>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">
                                    {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Patrimônio total</p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium text-destructive">Estoque Baixo</h3>
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </div>
                                <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Produtos precisando de reposição</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="text-lg font-semibold mb-6">Ranking de Produtos</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs font-medium" />
                                        <YAxis className="text-xs font-medium" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor Total" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card">
                            <div className="p-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                                    <h3 className="text-lg font-semibold">Produtos</h3>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar produtos..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Categoria</TableHead>
                                                <TableHead>Quantidade</TableHead>
                                                <TableHead>Preço Unit.</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        Carregando...
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredProducts?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-24 text-center">
                                                        Nenhum produto encontrado.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredProducts?.map((product) => (
                                                    <TableRow
                                                        key={product.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <TableCell className="font-medium">{product.name}</TableCell>
                                                        <TableCell>{product.category || "-"}</TableCell>
                                                        <TableCell>{product.quantity}</TableCell>
                                                        <TableCell>
                                                            {product.price.toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL",
                                                            })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {(product.quantity * product.price).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL",
                                                            })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {product.quantity <= product.min_stock_level ? (
                                                                <Badge variant="destructive">Baixo Estoque</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {canManage && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => { e.stopPropagation(); handleMovement(product); }}
                                                                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                                                                    >
                                                                        Movimentar
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports">
                        <InventoryReports />
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? "Editar Produto" : "Novo Produto"}
                        </DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        productToEdit={editingProduct || undefined}
                        onSuccess={() => {
                            setIsFormOpen(false); // Close dialog on success
                            setEditingProduct(null); // Reset editing state
                        }}
                    />
                </DialogContent>
            </Dialog>

            <MovementDialog
                product={selectedProduct}
                products={products}
                isOpen={isMovementOpen}
                onClose={() => setIsMovementOpen(false)}
            />
        </MainLayout>
    );
}
