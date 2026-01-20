
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, Plus, ArrowRight, Clock, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAdminOccurrenceStats, useAdministrativeOccurrences } from "@/hooks/useOccurrences";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RHDashboard() {
    const navigate = useNavigate();
    const { data: stats, isLoading: isLoadingStats } = useAdminOccurrenceStats();
    const { data: recentOccurrences, isLoading: isLoadingList } = useAdministrativeOccurrences();

    // Data for the Donut Chart
    const resolvidosData = [
        { name: "Concluídas", value: stats?.concluidas || 0, color: "#f59e0b" }, // amber-500
        { name: "Em Aberto", value: (stats?.total || 0) - (stats?.concluidas || 0), color: "#fef3c7" }, // amber-100
    ];

    const percentResolvidas = stats?.total ? Math.round((stats.concluidas / stats.total) * 100) : 0;

    const recentList = recentOccurrences?.slice(0, 5) || [];

    return (
        <MainLayout>
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                            <Briefcase className="h-6 w-6 text-amber-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                            Painel RH
                        </h1>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                        Gestão de Ocorrências Administrativas e de Pessoal.
                    </p>
                </div>

                {/* Botões de Ação Principal */}
                <section className="mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Button
                            onClick={() => navigate("/ocorrencias/nova/administrativa")}
                            size="lg"
                            className="flex-1 h-24 text-lg gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500/90 hover:to-yellow-500/90 shadow-lg transition-all hover:scale-[1.01]"
                        >
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-xl">Nova Ocorrência</span>
                                <span className="text-sm font-normal text-white/80">Registrar ponto, conduta ou procedimento</span>
                            </div>
                        </Button>

                        <Button
                            onClick={() => navigate("/ocorrencias/kanban")}
                            size="lg"
                            className="flex-1 h-24 text-lg gap-3 bg-white text-amber-900 border-2 border-amber-100 hover:bg-amber-50 shadow-md transition-all hover:scale-[1.01]"
                        >
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                                <Briefcase className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-xl">Kanban Administrativo</span>
                                <span className="text-sm font-normal text-muted-foreground">Gerenciar fluxo e assinaturas</span>
                            </div>
                        </Button>
                    </div>
                </section>

                {/* Quick Stats */}
                <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 mb-8">
                    <h3 className="text-sm font-medium text-amber-800 uppercase tracking-wide mb-4">
                        Resumo do Setor
                    </h3>
                    {isLoadingStats ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/50 h-[88px] flex flex-col justify-center items-center gap-2">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-white/60 flex flex-col justify-center items-center hover:bg-white/80 transition-colors shadow-sm">
                                <p className="text-2xl font-bold text-amber-900">{stats?.pendentes || 0}</p>
                                <p className="text-xs text-amber-700">Pendentes</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/60 flex flex-col justify-center items-center hover:bg-white/80 transition-colors shadow-sm">
                                <p className="text-2xl font-bold text-amber-900">{stats?.total || 0}</p>
                                <p className="text-xs text-amber-700">Total</p>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-white/60 flex flex-col justify-center items-center hover:bg-white/80 transition-colors shadow-sm">
                                <p className="text-2xl font-bold text-amber-900">{stats?.esteMes || 0}</p>
                                <p className="text-xs text-amber-700">Este Mês</p>
                            </div>

                            {/* Chart Card */}
                            <div className="relative p-2 rounded-lg bg-white/60 flex flex-col justify-center items-center overflow-hidden hover:bg-white/80 transition-colors shadow-sm">
                                <div className="h-16 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={resolvidosData}
                                                cx="50%"
                                                cy="50%"
                                                startAngle={90}
                                                endAngle={-270}
                                                innerRadius={25}
                                                outerRadius={35}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {resolvidosData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                formatter={(value: number) => [`${value}`, '']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Center Text Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                                    <span className="text-[10px] font-bold text-amber-900/60">{Math.round(percentResolvidas)}%</span>
                                </div>
                                <p className="text-xs text-amber-700 mt-[-4px] relative z-10">Resolvidas</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Recent Occurrences List */}
                <section className="animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Últimas Ocorrências
                        </h2>
                        <Button variant="ghost" className="text-sm text-primary" onClick={() => navigate("/ocorrencias/kanban")}>
                            Ver todas <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    {isLoadingList ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {recentList.map(item => (
                                <Card
                                    key={item.id}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                                    onClick={() => navigate(`/ocorrencias/admin/${item.id}`)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${item.status === 'concluido' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-foreground">{item.employee_name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 h-5">{item.type}</Badge>
                                                    <span className="text-xs flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className={item.status === 'concluido' ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                                                {item.status === 'concluido' ? "Concluída" : "Pendente"}
                                            </Badge>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {item.protocol}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {recentList.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    Nenhuma ocorrência registrada recentemente.
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </MainLayout>
    );
}
