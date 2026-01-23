import { useState, useMemo } from "react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Filter,
  Download,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileText,
  Search
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useOccurrences } from "@/hooks/useOccurrences";
import {
  typeLabels,
  statusConfig,
  triageConfig,
  outcomeConfig,
  OccurrenceType
} from "@/types/occurrence";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function Analise() {
  const { data: occurrences = [], isLoading } = useOccurrences();

  const [dateStart, setDateStart] = useState<Date | undefined>(subDays(new Date(), 30));
  const [dateEnd, setDateEnd] = useState<Date | undefined>(new Date());
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // --- Data Processing ---
  const filteredData = useMemo(() => {
    return occurrences.filter((occ) => {
      // Date Filter
      if (dateStart && dateEnd) {
        const d = new Date(occ.criado_em);
        if (!isWithinInterval(d, { start: startOfDay(dateStart), end: endOfDay(dateEnd) })) {
          return false;
        }
      }

      // Type Filter
      if (typeFilter !== "all" && occ.tipo !== typeFilter) {
        // Handle mapping normalization if needed, but usually exact match
        if (typeFilter === 'revisao_exame' && occ.tipo === 'assistencial') return true; // Legacy
        return false;
      }

      return true;
    });
  }, [occurrences, dateStart, dateEnd, typeFilter]);

  // KPI Calculations
  const total = filteredData.length;
  const closed = filteredData.filter(o => o.status === 'concluida').length;
  const open = total - closed;
  const triaged = filteredData.filter(o => !!o.triagem).length;
  const percentTriaged = total > 0 ? Math.round((triaged / total) * 100) : 0;

  // Chart Data: Status Distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(o => {
      const status = o.status;
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: statusConfig[key as any]?.label || key,
      value
    }));
  }, [filteredData]);

  // Chart Data: Type Distribution (Always shown unless single type selected)
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(o => {
      // Normalize assistencial -> revisao_exame for display
      let t = o.tipo === 'assistencial' ? 'revisao_exame' : o.tipo;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: typeLabels[key as any] || key,
      value
    }));
  }, [filteredData]);

  // Specific Data: Revisão de Exame Analysis
  const revisaoData = useMemo(() => {
    return filteredData.filter(o => o.tipo === 'revisao_exame' || o.tipo === 'assistencial');
  }, [filteredData]);

  const outcomeData = useMemo(() => {
    const counts: Record<string, number> = {};
    revisaoData.forEach(o => {
      if (o.desfecho_tipos && o.desfecho_tipos.length > 0) {
        o.desfecho_tipos.forEach((d: string) => {
          counts[d] = (counts[d] || 0) + 1;
        });
      } else {
        counts['pendente'] = (counts['pendente'] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: outcomeConfig[key as any]?.label || (key === 'pendente' ? 'Pendente' : key),
      value
    })).sort((a, b) => b.value - a.value);
  }, [revisaoData]);

  const triageData = useMemo(() => {
    const counts: Record<string, number> = {};
    revisaoData.forEach(o => {
      const t = o.triagem || 'nao_triado';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: triageConfig[key as any]?.label || (key === 'nao_triado' ? 'Não Triado' : key),
      value
    }));
  }, [revisaoData]);

  const recentObservations = useMemo(() => {
    // Get top 5 most recent revision occurrences with description
    return revisaoData
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .slice(0, 5);
  }, [revisaoData]);


  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panorama Geral</h1>
              <p className="text-sm text-muted-foreground">
                Análise estratégica de ocorrências e indicadores
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="revisao_exame">Revisão de Exame</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="enfermagem">Enfermagem</SelectItem>
                <SelectItem value="tecnica">Técnica</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateStart && dateEnd ? (
                    <>
                      {format(dateStart, "dd/MM")} - {format(dateEnd, "dd/MM/yyyy")}
                    </>
                  ) : (
                    <span>Selecione período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateEnd}
                  selected={{ from: dateStart, to: dateEnd }}
                  onSelect={(range) => {
                    setDateStart(range?.from);
                    setDateEnd(range?.to);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ocorrências</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">No período selecionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{closed}</div>
              <p className="text-xs text-muted-foreground">
                {total > 0 ? Math.round((closed / total) * 100) : 0}% de resolução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertas / Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{open}</div>
              <p className="text-xs text-muted-foreground">Aguardando finalização</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Triagem</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{percentTriaged}%</div>
              <p className="text-xs text-muted-foreground">Classificadas com risco</p>
            </CardContent>
          </Card>
        </div>

        {/* General Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Visão geral do andamento dos chamados</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Volume por Tipo</CardTitle>
              <CardDescription>Categorias mais incidentes no período</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Specific Analysis: Revisão de Exames */}
        {(typeFilter === 'all' || typeFilter === 'revisao_exame') && (
          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Detalhamento: Revisão de Laudos</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desfechos de Revisão</CardTitle>
                  <CardDescription>Resultados das análises concluídas</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outcomeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Classificação de Risco (Triagem)</CardTitle>
                  <CardDescription>Gravidade dos incidentes de revisão</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={triageData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffc658" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Observations / Recent Items */}
            <Card>
              <CardHeader>
                <CardTitle>Principais Observações Recentes</CardTitle>
                <CardDescription>Últimas ocorrências de laudo registradas para acompanhamento qualitativo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentObservations.map(occ => (
                    <div key={occ.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/20">
                      <div className="min-w-[120px]">
                        <Badge variant="outline" className="mb-2">{occ.protocolo}</Badge>
                        <div className="text-xs text-muted-foreground">{format(new Date(occ.criado_em), "dd/MM/yyyy")}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{occ.paciente_nome_completo || "Paciente não informado"}</h4>
                        <h4 className="font-semibold text-sm mb-1">{occ.paciente_nome_completo || "Paciente não informado"}</h4>
                        <div className="text-sm text-foreground/80">
                          {(() => {
                            try {
                              if (occ.descricao_detalhada?.startsWith('{')) {
                                const parsed = JSON.parse(occ.descricao_detalhada);
                                return (
                                  <div className="space-y-1 mt-1 text-xs">
                                    {parsed.exameModalidade && <div className="flex gap-1"><span className="font-semibold">Exame:</span> {parsed.exameModalidade}</div>}
                                    {parsed.exameRegiao && <div className="flex gap-1"><span className="font-semibold">Região:</span> {parsed.exameRegiao}</div>}
                                    {parsed.motivoRevisao && <div className="flex gap-1"><span className="font-semibold">Motivo:</span> {parsed.motivoRevisao}</div>}
                                    {parsed.acaoTomada && <div className="flex gap-1"><span className="font-semibold">Ação:</span> {parsed.acaoTomada}</div>}
                                  </div>
                                );
                              }
                              return <p className="line-clamp-2">{occ.descricao_detalhada}</p>;
                            } catch (e) {
                              return <p className="line-clamp-2">{occ.descricao_detalhada}</p>;
                            }
                          })()}
                        </div>
                        {occ.desfecho_tipos && occ.desfecho_tipos.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="font-semibold">Desfecho: </span>
                            {occ.desfecho_tipos.map((d: any) => outcomeConfig[d as any]?.label).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {recentObservations.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">Nenhuma observação recente encontrada com os filtros atuais.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
