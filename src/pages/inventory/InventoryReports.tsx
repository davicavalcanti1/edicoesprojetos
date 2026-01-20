import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Save, X, Search, ArrowUpCircle, ArrowDownCircle, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useInventory } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

type Period = "daily" | "weekly" | "monthly" | "trimester" | "semester" | "annual" | "all";

export function InventoryReports() {
    const [period, setPeriod] = useState<Period>("monthly");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSector, setSelectedSector] = useState("all");
    const [editingMovement, setEditingMovement] = useState<any>(null); // State for the movement being edited

    const { deleteMovement, updateMovement } = useInventory();
    const { role } = useAuth();
    const canManage = role === 'admin' || role === 'estoque';

    const { data: sectors } = useQuery({
        queryKey: ["inventory-sectors"],
        queryFn: async () => {
            const { data } = await (supabase as any).from("inventory_sectors").select("*").order("name");
            return data || [];
        }
    });

    const { data: movements, isLoading } = useQuery({
        queryKey: ["inventory-movements", period, selectedSector],
        queryFn: async () => {
            let query = (supabase as any)
                .from("inventory_movements")
                .select(`
          *,
          product:inventory_products(name),
          sector:inventory_sectors(name),
          user:profiles(full_name)
        `)
                .order("created_at", { ascending: false });

            // Apply date filter based on period
            const now = new Date();
            let startDate = new Date();

            if (period !== "all") {
                switch (period) {
                    case "daily":
                        startDate.setDate(now.getDate() - 1);
                        break;
                    case "weekly":
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case "monthly":
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case "trimester":
                        startDate.setMonth(now.getMonth() - 3);
                        break;
                    case "semester":
                        startDate.setMonth(now.getMonth() - 6);
                        break;
                    case "annual":
                        startDate.setFullYear(now.getFullYear() - 1);
                        break;
                }
                query = query.gte("created_at", startDate.toISOString());
            }

            if (selectedSector && selectedSector !== "all") {
                query = query.eq("sector_id", selectedSector);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
    });

    // Client-side search for product name (since we are joining)
    const filteredMovements = movements?.filter((m: any) => {
        if (!searchTerm) return true;
        const productName = m.product?.name?.toLowerCase() || "";
        return productName.includes(searchTerm.toLowerCase());
    });

    // Calculate Aggregates based on filtered data
    const totalIn = filteredMovements?.filter((m: any) => m.type === "IN").reduce((acc: number, m: any) => acc + m.quantity, 0) || 0;
    const totalOut = filteredMovements?.filter((m: any) => m.type === "OUT").reduce((acc: number, m: any) => acc + m.quantity, 0) || 0;

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta movimentação? O estoque será recalculado.")) {
            await deleteMovement.mutateAsync(id);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMovement) return;

        await updateMovement.mutateAsync({
            id: editingMovement.id,
            quantity: Number(editingMovement.quantity),
            reason: editingMovement.reason
        });
        setEditingMovement(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Relatórios de Movimentação</h2>

                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Setores</SelectItem>
                            {sectors?.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Últimas 24 horas</SelectItem>
                            <SelectItem value="weekly">Última Semana</SelectItem>
                            <SelectItem value="monthly">Último Mês</SelectItem>
                            <SelectItem value="trimester">Último Trimestre</SelectItem>
                            <SelectItem value="semester">Último Semestre</SelectItem>
                            <SelectItem value="annual">Último Ano</SelectItem>
                            <SelectItem value="all">Todo o Período</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entradas (Filtro Atual)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{totalIn}</div>
                        <p className="text-xs text-muted-foreground">produtos adicionados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saídas (Filtro Atual)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{totalOut}</div>
                        <p className="text-xs text-muted-foreground">baixas realizadas</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                    <CardDescription>
                        Registro detalhado de todas as entradas e saídas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Destino/Origem</TableHead>
                                <TableHead>Usuário</TableHead>
                                {canManage && <TableHead className="text-right">Ações</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                                </TableRow>
                            ) : filteredMovements?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">Nenhuma movimentação no período.</TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements?.map((movement: any) => (
                                    <TableRow key={movement.id}>
                                        <TableCell>
                                            {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="font-medium">{movement.product?.name || "Produto excluído"}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${movement.type === "IN"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700"
                                                }`}>
                                                {movement.type === "IN" ? "ENTRADA" : "SAÍDA"}
                                            </span>
                                        </TableCell>
                                        <TableCell>{movement.quantity}</TableCell>
                                        <TableCell>
                                            {movement.type === "OUT" ? (movement.sector?.name || "-") : "-"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {movement.user?.full_name || movement.user_id?.slice(0, 8) + "..."}
                                        </TableCell>
                                        {canManage && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => setEditingMovement(movement)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(movement.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingMovement} onOpenChange={(open) => !open && setEditingMovement(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Movimentação</DialogTitle>
                    </DialogHeader>
                    {editingMovement && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Quantidade</label>
                                <Input
                                    type="number"
                                    value={editingMovement.quantity}
                                    onChange={(e) => setEditingMovement({ ...editingMovement, quantity: e.target.value })}
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Motivo/Observação</label>
                                <Input
                                    value={editingMovement.reason || ""}
                                    onChange={(e) => setEditingMovement({ ...editingMovement, reason: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingMovement(null)}>Cancelar</Button>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
