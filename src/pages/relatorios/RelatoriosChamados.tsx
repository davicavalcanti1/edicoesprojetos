
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download, Search, Eye, FileText } from "lucide-react";
import { startOfDay, endOfDay, subDays, startOfMonth, format, parseISO } from "date-fns";

export default function RelatoriosChamados({ typeFilter, embedded, excludeTypes }: { typeFilter?: 'ar_condicionado' | 'dispenser' | 'banheiro' | undefined, embedded?: boolean, excludeTypes?: string[] }) {
    // Filtros
    const [periodo, setPeriodo] = useState("30dias");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [filtroStatus, setFiltroStatus] = useState("todos");
    const [busca, setBusca] = useState("");

    // Dados
    const [loading, setLoading] = useState(false);
    const [chamados, setChamados] = useState<any[]>([]);
    const [chamadoSelecionado, setChamadoSelecionado] = useState<any>(null); // Para modal

    // Paginação simples (client-side para simplificar view filtering, mas ideal seria server-side se volume > 1000)
    const [pagina, setPagina] = useState(1);
    const ITENS_POR_PAGINA = 10;

    useEffect(() => {
        carregarDados();
    }, [periodo, dataInicio, dataFim, filtroTipo, filtroStatus, typeFilter, excludeTypes]); // Busca dispara no reload mas filtro de texto é local ou debounce? Faremos query no fetch para filtros pesados

    const getIntervalo = () => {
        const hoje = new Date();
        let start = startOfDay(hoje);
        let end = endOfDay(hoje);

        if (periodo === "hoje") {
            // já está setado
        } else if (periodo === "7dias") {
            start = subDays(start, 7);
        } else if (periodo === "30dias") {
            start = subDays(start, 30);
        } else if (periodo === "mesAtual") {
            start = startOfMonth(hoje);
        } else if (periodo === "custom" && dataInicio && dataFim) {
            start = startOfDay(parseISO(dataInicio));
            end = endOfDay(parseISO(dataFim));
        }

        return { start, end };
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            const { start, end } = getIntervalo();

            if (periodo === "custom" && (!dataInicio || !dataFim)) {
                setLoading(false);
                return;
            }

            // @ts-ignore
            let query = supabase
                .from("operacional_chamados_view")
                .select("*")
                .gte("data_abertura", start.toISOString())
                .lte("data_abertura", end.toISOString())
                .order('data_abertura', { ascending: false });

            // Prop overrides state if present
            const effectiveType = typeFilter || (filtroTipo !== "todos" ? filtroTipo : null);

            if (effectiveType) {
                query = query.eq("tipo_chamado", effectiveType);
            }

            if (excludeTypes && excludeTypes.length > 0) {
                const filterStr = `(${excludeTypes.map(t => `"${t}"`).join(',')})`;
                query = query.not('tipo_chamado', 'in', filterStr);
            }

            if (filtroStatus === "abertos") {
                // Status na view é 'registrada' ou 'concluida'. Aberto = registrada
                query = query.eq("status", "registrada");
            } else if (filtroStatus === "finalizados") {
                query = query.eq("status", "concluida");
            }

            const { data, error } = await query;

            if (error) throw error;
            setChamados(data || []);
            setPagina(1);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filtragem Local de Busca Textual (Protocolo ou Localizacao)
    const dadosFiltrados = chamados.filter(item => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
            item.protocolo?.toLowerCase().includes(termo) ||
            item.localizacao?.toLowerCase().includes(termo) ||
            item.problema?.toLowerCase().includes(termo)
        );
    });

    // Paginação
    const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
    const dadosPaginados = dadosFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

    const exportarCSV = () => {
        const headers = ["Data Abertura", "Protocolo", "Tipo", "Localizacao", "Problema", "Status", "Data Fechamento", "Finalizado Por", "Tempo (h)"];
        const csvContent = [
            headers.join(","),
            ...dadosFiltrados.map(item => [
                item.data_abertura,
                item.protocolo,
                item.tipo_chamado,
                `"${item.localizacao}"`, // escape commas
                `"${item.problema}"`,
                item.status,
                item.data_fechamento || "",
                `"${item.finalizado_por || ""}"`,
                item.tempo_resolucao_horas || ""
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio_chamados_${format(new Date(), "yyyyMMdd")}.csv`;
        link.click();
    };

    const content = (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row gap-4 justify-between">
                        <div className="flex flex-wrap gap-4 items-center">
                            <Select value={periodo} onValueChange={setPeriodo}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hoje">Hoje</SelectItem>
                                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                                    <SelectItem value="mesAtual">Mês Atual</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                            {periodo === "custom" && (
                                <>
                                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-[140px]" />
                                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-[140px]" />
                                </>
                            )}

                            {!typeFilter && (
                                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos Tipos</SelectItem>
                                        <SelectItem value="dispenser">Dispenser</SelectItem>
                                        <SelectItem value="banheiro">Banheiro</SelectItem>
                                        <SelectItem value="ar_condicionado">Ar Condicionado</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos Status</SelectItem>
                                    <SelectItem value="abertos">Abertos</SelectItem>
                                    <SelectItem value="finalizados">Finalizados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                            <div className="relative w-full lg:w-[250px]">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar protocolo, local..."
                                    className="pl-8"
                                    value={busca}
                                    onChange={e => setBusca(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" onClick={exportarCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Protocolo</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Localização</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : dadosPaginados.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Nenhum chamado encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dadosPaginados.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(parseISO(item.data_abertura), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.protocolo}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{item.tipo_chamado}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={item.localizacao}>{item.localizacao}</TableCell>
                                            <TableCell>
                                                {item.status === 'concluida' ?
                                                    <Badge className="bg-green-600 hover:bg-green-700">Finalizado</Badge> :
                                                    <Badge variant="destructive">Aberto</Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setChamadoSelecionado(item)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginação */}
                    {totalPaginas > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button variant="outline" size="sm" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>
                                Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Página {pagina} de {totalPaginas}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>
                                Próxima
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Detalhes */}
            <Dialog open={!!chamadoSelecionado} onOpenChange={(open) => !open && setChamadoSelecionado(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Chamado</DialogTitle>
                        <DialogDescription>Protocolo: {chamadoSelecionado?.protocolo}</DialogDescription>
                    </DialogHeader>
                    {chamadoSelecionado && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                                <p className="capitalize">{chamadoSelecionado.tipo_chamado}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <p className="capitalize">{chamadoSelecionado.status === 'concluida' ? 'Finalizado' : 'Aberto'}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Localização</p>
                                <p>{chamadoSelecionado.localizacao}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Descrição / Detalhes</p>
                                <p className="whitespace-pre-wrap text-sm bg-muted p-2 rounded">{chamadoSelecionado.descricao_detalhada}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Data Abertura</p>
                                <p>{format(parseISO(chamadoSelecionado.data_abertura), "dd/MM/yyyy HH:mm")}</p>
                            </div>
                            {chamadoSelecionado.data_fechamento && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Data Fechamento</p>
                                    <p>{format(parseISO(chamadoSelecionado.data_fechamento), "dd/MM/yyyy HH:mm")}</p>
                                </div>
                            )}

                            {chamadoSelecionado.finalizado_por && (
                                <div className="space-y-1 col-span-2 border-t pt-2 mt-2">
                                    <p className="text-sm font-medium text-muted-foreground">Finalizado Por</p>
                                    <p>{chamadoSelecionado.finalizado_por}</p>
                                </div>
                            )}
                            {chamadoSelecionado.observacoes_fechamento && (
                                <div className="space-y-1 col-span-2">
                                    <p className="text-sm font-medium text-muted-foreground">Observações de Fechamento</p>
                                    <p className="text-sm italic">{chamadoSelecionado.observacoes_fechamento}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );

    if (embedded) {
        return content;
    }

    return (
        <SimpleLayout title="Relatórios de Chamados" subtitle="Consulta detalhada e exportação">
            {content}
        </SimpleLayout>
    );
}

