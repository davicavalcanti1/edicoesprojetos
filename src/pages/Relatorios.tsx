import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Filter,
  Calendar,
  RefreshCw,
  Loader2,
  Download,
  Briefcase,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useOccurrenceStats, useAdminOccurrenceStats, useNursingOccurrenceStats } from "@/hooks/useOccurrences";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadDashboardPDF } from "@/lib/pdf/dashboard-pdf";
import { useToast } from "@/hooks/use-toast";

// Helper for exam labels
const examTypeLabels: Record<string, string> = {
  ressonancia_magnetica: "Ressonância Magnética",
  tomografia: "Tomografia",
  raio_x: "Raio-X",
  densitometria: "Densitometria",
  mamografia: "Mamografia",
  ultrassonografia: "Ultrassonografia",
  pet_ct: "PET-CT",
  angiografia: "Angiografia",
  fluoroscopia: "Fluoroscopia",
  medicina_nuclear: "Medicina Nuclear",
  outro: "Outro",
  nao_informado: "Não informado",
};

export default function Relatorios() {
  const { role, tenant } = useAuth();
  const { toast } = useToast();

  // Dashboard View State
  const [dashboardView, setDashboardView] = useState<'revisao' | 'enfermagem' | 'admin'>(
    role === 'rh' ? 'admin' : role === 'enfermagem' ? 'enfermagem' : 'revisao'
  );

  const { data: stats, isLoading } = useOccurrenceStats(); // Legacy/Revisao
  const { data: adminStats, isLoading: isLoadingAdminStats } = useAdminOccurrenceStats();
  const { data: nursingStats, isLoading: isLoadingNursingStats } = useNursingOccurrenceStats();

  // Data for Charts
  const revisaoResolvidasData = [
    { name: "Concluídas", value: stats?.concluidas || 0, color: "#2563eb" }, // primary (blue-600)
    { name: "Em Aberto", value: (stats?.total || 0) - (stats?.concluidas || 0), color: "#e2e8f0" }, // muted (slate-200)
  ];
  const percentRevisaoResolvidas = stats?.total ? Math.round((stats.concluidas / stats.total) * 100) : 0;

  const nursingSubtypesData = [
    { name: "Extravasamento", value: nursingStats?.bySubtype?.extravasamento || 0, color: "#ef4444" }, // red
    { name: "Reação Adversa", value: nursingStats?.bySubtype?.reacao_adversa || 0, color: "#f59e0b" }, // amber
  ];

  const adminResolvidasData = [
    { name: "Concluídas", value: adminStats?.concluidas || 0, color: "#d97706" }, // amber-600
    { name: "Em Aberto", value: (adminStats?.total || 0) - (adminStats?.concluidas || 0), color: "#fef3c7" }, // amber-100
  ];
  const percentAdminResolvidas = adminStats?.total ? Math.round((adminStats.concluidas / adminStats.total) * 100) : 0;

  const handleDownloadPDF = async () => {
    if (!stats) return;
    // Note: PDF generation might need to be adapted for specific tabs, currently using legacy
    downloadDashboardPDF(stats, "30d", tenant?.name);
    toast({
      title: "PDF gerado",
      description: "O relatório do dashboard foi baixado com sucesso.",
    });
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Visão geral e indicadores de performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PDF Export temporarily disabled / mocked */}
            {/* <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button> */}
          </div>
        </div>

        {/* Admin Dashboard Tabs */}
        {role === 'admin' && (
          <div className="flex p-1 bg-muted rounded-xl mb-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <Button
              variant={dashboardView === 'revisao' ? 'default' : 'ghost'}
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              onClick={() => setDashboardView('revisao')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Revisão de Exame
            </Button>
            <Button
              variant={dashboardView === 'enfermagem' ? 'default' : 'ghost'}
              className="flex-1 rounded-lg"
              onClick={() => setDashboardView('enfermagem')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Enfermagem
            </Button>
            <Button
              variant={dashboardView === 'admin' ? 'default' : 'ghost'}
              className="flex-1 rounded-lg"
              onClick={() => setDashboardView('admin')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Administrativo
            </Button>
          </div>
        )}

        {/* REVISÃO DE EXAME DASHBOARD */}
        {(dashboardView === 'revisao' || role !== 'admin') && (
          <section className="space-y-6 mb-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            {/* KPI Cards */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Indicadores Revisão de Exame
              </h3>
              {isLoading ? (
                <SkeletonSection />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard value={stats?.pendentes || 0} label="Pendentes" />
                  <StatCard value={stats?.emAnalise || 0} label="Em Análise" />
                  <StatCard value={stats?.esteMes || 0} label="Este Mês" />
                  <ChartCard
                    data={revisaoResolvidasData}
                    centerLabel={`${percentRevisaoResolvidas}%`}
                    bottomLabel="Resolvidas"
                  />
                </div>
              )}
            </div>

            {/* Detailed Charts Row */}
            {!isLoading && stats?.revisaoExame && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Modality Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Por Modalidade</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(stats.revisaoExame.byExamType).map(([name, value]) => ({ name: examTypeLabels[name] || name, value })).slice(0, 8)} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Doctor Chart */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Por Médico Responsável</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(stats.revisaoExame.byDoctor).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} interval={0} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ENFERMAGEM DASHBOARD */}
        {(role === 'admin' || role === 'user' || role === 'enfermagem') && dashboardView === 'enfermagem' && (
          <section className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-6 mb-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
            <h3 className="text-sm font-medium text-emerald-800 uppercase tracking-wide mb-4">
              Indicadores de Enfermagem
            </h3>
            {isLoadingNursingStats ? (
              <SkeletonSection />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard value={nursingStats?.total || 0} label="Total Registros" />
                <StatCard value={nursingStats?.pendentes || 0} label="Pendentes" />
                <StatCard value={nursingStats?.concluidas || 0} label="Concluídas" />

                {/* Chart Card for Subtypes */}
                <div className="relative p-2 rounded-lg bg-background/50 flex flex-col justify-center items-center overflow-hidden hover:bg-background/80 transition-colors shadow-sm">
                  <div className="h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={nursingSubtypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={35}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {nursingSubtypesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0 font-medium">Tipos</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ADMINISTRATIVO DASHBOARD */}
        {(role === 'admin' || role === 'rh') && dashboardView === 'admin' && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
            <h3 className="text-sm font-medium text-amber-800 uppercase tracking-wide mb-4">
              Indicadores Administrativos
            </h3>
            {isLoadingAdminStats ? (
              <SkeletonSection />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard value={adminStats?.pendentes || 0} label="Pendentes" colorClass="text-amber-900" />
                <StatCard value={adminStats?.concluidas || 0} label="Concluídas" colorClass="text-amber-900" />
                <StatCard value={adminStats?.total || 0} label="Total" colorClass="text-amber-900" />

                {/* Chart Card */}
                <ChartCard
                  data={adminResolvidasData}
                  centerLabel={`${percentAdminResolvidas}%`}
                  bottomLabel="Resolvidas"
                />
              </div>
            )}
          </section>
        )}
      </div>
    </MainLayout>
  );
}

// Helper Components
function StatCard({ value, label, colorClass = "text-foreground" }: { value: number, label: string, colorClass?: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-background/50 flex flex-col justify-center items-center hover:bg-background/80 transition-colors shadow-sm">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartCard({ data, centerLabel, bottomLabel }: { data: any[], centerLabel: string, bottomLabel: string }) {
  return (
    <div className="relative p-2 rounded-lg bg-background/50 flex flex-col justify-center items-center overflow-hidden hover:bg-background/80 transition-colors shadow-sm">
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
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
              {data.map((entry, index) => (
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
        <span className="text-[10px] font-bold text-muted-foreground/60">{centerLabel}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-[-4px] relative z-10">{bottomLabel}</p>
    </div>
  )
}

function SkeletonSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg bg-secondary/30 h-[88px] flex flex-col justify-center items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
