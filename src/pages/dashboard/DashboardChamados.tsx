
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCcw, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { startOfDay, endOfDay, subDays, startOfMonth, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardChamados({ typeFilter, embedded, excludeTypes }: { typeFilter?: 'ar_condicionado' | 'dispenser' | 'banheiro' | undefined, embedded?: boolean, excludeTypes?: string[] }) {
    // Estados de Filtro
    const [periodo, setPeriodo] = useState("hoje");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    // Estados de Dados
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState<any[]>([]);
    const [metricas, setMetricas] = useState({
        total: 0,
        abertos: 0,
        finalizados: 0,
        taxaFinalizacao: 0,
        tempoMedio: 0, // horas
        tipoMaisFrequente: "-",
        topLocais: [] as any[]
    });

    // Ao montar ou mudar filtros
    useEffect(() => {
        carregarDados();
    }, [periodo, dataInicio, dataFim, typeFilter, excludeTypes]);

    const getIntervalo = () => {
        const hoje = new Date();
        let start = startOfDay(hoje);
        let end = endOfDay(hoje);

        if (periodo === "7dias") {
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

            // Se for custom incompleto, nao busca ainda
            if (periodo === "custom" && (!dataInicio || !dataFim)) {
                setLoading(false);
                return;
            }

            // @ts-ignore
            let query = supabase
                .from("operacional_chamados_view")
                .select("*")
                .gte("data_abertura", start.toISOString())
                .lte("data_abertura", end.toISOString());

            if (typeFilter) {
                query = query.eq("tipo_chamado", typeFilter);
            }

            if (excludeTypes && excludeTypes.length > 0) {
                // Format for PostgREST: ("val1","val2")
                const filterStr = `(${excludeTypes.map(t => `"${t}"`).join(',')})`;
                query = query.not('tipo_chamado', 'in', filterStr);
            }

            const { data, error } = await query;

            if (error) throw error;

            processarMetricas(data || []);
            setDados(data || []);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const processarMetricas = (items: any[]) => {
        const total = items.length;
        if (total === 0) {
            setMetricas({
                total: 0, abertos: 0, finalizados: 0, taxaFinalizacao: 0, tempoMedio: 0, tipoMaisFrequente: "-", topLocais: []
            });
            return;
        }

        const finalizados = items.filter(i =>
            (i.status && ["concluida", "concluido", "resolvido"].includes(i.status.toLowerCase())) ||
            i.data_fechamento
        ).length;
        const abertos = total - finalizados; // ou filtrar status != concluida
        const taxaFinalizacao = (finalizados / total) * 100;

        // Tempo médio (apenas dos finalizados)
        const itemsComTempo = items.filter(i => i.tempo_resolucao_horas !== null);
        const somaTempo = itemsComTempo.reduce((acc, curr) => acc + (curr.tempo_resolucao_horas || 0), 0);
        const tempoMedio = itemsComTempo.length ? (somaTempo / itemsComTempo.length) : 0;

        // Tipo Mias Frequente
        const tipos = items.reduce((acc: any, curr) => {
            acc[curr.tipo_chamado] = (acc[curr.tipo_chamado] || 0) + 1;
            return acc;
        }, {});
        const tipoMaisFrequente = Object.keys(tipos).reduce((a, b) => tipos[a] > tipos[b] ? a : b, "-");

        // Top Locais
        const locais = items.reduce((acc: any, curr) => {
            const loc = curr.localizacao || "N/A";
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {});
        const topLocais = Object.entries(locais)
            .map(([name, value]) => ({ name, value }))
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 5);

        setMetricas({
            total,
            abertos,
            finalizados,
            taxaFinalizacao,
            tempoMedio,
            tipoMaisFrequente,
            topLocais
        });
    };

    // Extrair tipos únicos para gráficos dinâmicos
    const uniqueTypes = Array.from(new Set(dados.map(d => d.tipo_chamado))).filter(Boolean);

    // Preparar dados para Gráficos
    const dadosPorDia = () => {
        // Agrupar por dia (dd/MM)
        const agrupado = dados.reduce((acc: any, curr) => {
            const dataStr = format(parseISO(curr.data_abertura), "dd/MM", { locale: ptBR });
            if (!acc[dataStr]) {
                acc[dataStr] = { name: dataStr, total: 0 };
                uniqueTypes.forEach(t => acc[dataStr][t] = 0);
            }

            acc[dataStr].total += 1;
            if (curr.tipo_chamado) {
                acc[dataStr][curr.tipo_chamado] = (acc[dataStr][curr.tipo_chamado] || 0) + 1;
            }

            return acc;
        }, {});

        return Object.values(agrupado); // Recharts aceita array
    };

    const dadosPorTipo = uniqueTypes.map(type => ({
        name: type,
        value: dados.filter(d => d.tipo_chamado === type).length
    })).filter(d => d.value > 0);

    const content = (
        <div className="space-y-6">

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Período:</span>
                    </div>
                    <Select value={periodo} onValueChange={setPeriodo}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione" />
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
                        <div className="flex gap-2 items-center animate-in fade-in">
                            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-[160px]" />
                            <span>até</span>
                            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-[160px]" />
                        </div>
                    )}

                    <Button variant="ghost" size="icon" onClick={carregarDados} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardContent>
            </Card>

            {/* Cards Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Chamados</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{metricas.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-orange-500">{metricas.abertos}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{metricas.finalizados}</div>
                        <p className="text-xs text-muted-foreground">{metricas.taxaFinalizacao.toFixed(1)}% taxa</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{metricas.tempoMedio.toFixed(1)} h</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Mais Frequente</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold capitalize">{metricas.tipoMaisFrequente}</div></CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader><CardTitle>Chamados por Dia</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dadosPorDia()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#000000" strokeWidth={2} name="Total Geral" />
                                {uniqueTypes.map((type, index) => (
                                    <Line
                                        key={type}
                                        type="monotone"
                                        dataKey={type}
                                        stroke={COLORS[index % COLORS.length]}
                                        name={type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader><CardTitle>Por Tipo</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dadosPorTipo}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {dadosPorTipo.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader><CardTitle>Top 5 Localizações</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metricas.topLocais} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" name="Qtd. Chamados" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <SimpleLayout title="Dashboard de Chamados" subtitle="Visão geral operacional">
            {content}
        </SimpleLayout>
    );
}
