import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Filter, Eye, Loader2, Calendar, Columns3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TriageBadge } from "@/components/triage/TriageBadge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import {
  OccurrenceStatus,
  statusConfig,
  TriageClassification,
} from "@/types/occurrence";
import { useOccurrences, useAdministrativeOccurrences, useNursingOccurrences, usePatientOccurrencesList } from "@/hooks/useOccurrences";
import { downloadOccurrencePDF } from "@/lib/pdf/occurrence-pdf";
import { downloadAdminOccurrencePDF } from "@/lib/pdf/admin-occurrence-pdf";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  administrativa: "Administrativa",
  revisao_exame: "Revisão de Exame",
  assistencial: "Revisão de Exame",
  enfermagem: "Enfermagem",
  paciente: "Paciente",
  simples: "Simples",
  livre: "Livre",
};

export default function Ocorrencias() {
  const navigate = useNavigate();
  const { role, profile, isLoading: isAuthLoading } = useAuth();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [triageFilter, setTriageFilter] = useState<string>("all");
  const [cpfFilter, setCpfFilter] = useState("");
  const [examIdFilter, setExamIdFilter] = useState("");
  const [dateStart, setDateStart] = useState<Date | undefined>();
  const [dateEnd, setDateEnd] = useState<Date | undefined>();

  const { data: allOccurrences = [], isLoading: isDataLoading } = useOccurrences();

  // Unified Data Merging
  const unifiedData = useMemo(() => {
    return allOccurrences.map((item) => {
      let normalizedType = item.tipo;
      let sourceOrigin = 'assistencial'; // Default

      if (item.original_table === 'ocorrencia_adm') {
        sourceOrigin = 'admin';
        normalizedType = 'administrativa';
      } else if (item.original_table === 'ocorrencia_enf') {
        sourceOrigin = 'nursing';
        normalizedType = 'enfermagem';
      } else if (item.original_table === 'ocorrencia_laudo') {
        sourceOrigin = 'assistencial';
        normalizedType = 'revisao_exame';
      } else if (item.original_table === 'occurrences') {
        sourceOrigin = item.tipo === 'paciente' ? 'paciente' : 'livre';
      }

      return {
        ...item,
        normalizedType,
        sourceOrigin,
        searchString: [
          item.protocolo,
          item.paciente_nome,
          item.descricao,
          // Add other specific fields if they exist in raw_data
          (item.raw_data as any)?.patient_name,
          (item.raw_data as any)?.employee_name,
          (item.raw_data as any)?.descricao_detalhada
        ].filter(Boolean).join(" ").toLowerCase()
      };
    });
  }, [allOccurrences]);

  // Filters
  const filteredData = useMemo(() => {
    return unifiedData.filter(item => {
      // 1. Search
      if (searchTerm) {
        if (!item.searchString.includes(searchTerm.toLowerCase())) return false;
      }

      // 2. Type
      if (typeFilter !== 'all') {
        if (item.normalizedType !== typeFilter) return false;
      }

      // 2.1 Hide Technical Occurrences (as requested by user)
      if (item.normalizedType === 'tecnica') return false;

      // 3. Status
      if (statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }

      // 4. Triage
      if (triageFilter !== 'all') {
        if (item.triagem !== triageFilter) return false;
      }

      // 5. CPF (Specific check)
      if (cpfFilter) {
        const pid = item.paciente_id || (item.raw_data as any)?.patient_id;
        if (!pid || !pid.includes(cpfFilter)) return false;
      }

      // 6. Exam ID / Protocol
      if (examIdFilter) {
        const proto = item.protocolo || "";
        const exam = (item.raw_data as any)?.paciente_tipo_exame || "";
        if (!proto.includes(examIdFilter) && !exam.includes(examIdFilter)) return false;
      }

      // 7. Date
      if (dateStart || dateEnd) {
        const d = new Date(item.criado_em);
        if (dateStart && d < dateStart) return false;
        if (dateEnd) {
          const endOfDay = new Date(dateEnd);
          endOfDay.setHours(23, 59, 59, 999);
          if (d > endOfDay) return false;
        }
      }

      return true;
    });
  }, [unifiedData, searchTerm, statusFilter, typeFilter, triageFilter, cpfFilter, examIdFilter, dateStart, dateEnd]);

  // Handlers
  const handleNavigate = (item: any) => {
    if (item.original_table === 'ocorrencia_enf') {
      navigate(`/ocorrencias/enfermagem/${item.id}`);
    } else if (item.original_table === 'ocorrencia_adm') {
      navigate(`/ocorrencias/admin/${item.id}`);
    } else {
      // assistencial, occurrences (livre, paciente), laudo
      navigate(`/ocorrencias/${item.id}`);
    }
  };

  const handleDownloadPdf = (item: any) => {
    if (item.original_table === 'ocorrencia_adm') {
      // Map back to format expected by PDF generator if needed
      downloadAdminOccurrencePDF(item.raw_data);
    } else {
      let data = { ...item.raw_data };
      // Normalization for PDF generator which expects specific fields
      if (!data.paciente && (data.patient_name || data.employee_name)) {
        data.paciente = {
          nomeCompleto: data.patient_name || data.employee_name,
          idPaciente: data.patient_id || data.employee_id,
          dataHoraEvento: data.occurrence_date || data.created_at,
        };
      }
      downloadOccurrencePDF(data);
    }
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OCORRÊNCIAS</h1>
            <p className="text-muted-foreground mt-1">
              Gestão unificada de chamados e eventos
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/kanbans')}
              className="flex items-center gap-2 flex-1 md:flex-none"
            >
              <Columns3 className="h-4 w-4" />
              Modo Kanban
            </Button>
            <Button
              onClick={() => navigate('/ocorrencias/nova-livre')}
              className="flex items-center gap-2 flex-1 md:flex-none"
            >
              <FileText className="h-4 w-4" />
              Nova Ocorrência
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-xl border bg-card shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="revisao_exame">Revisão de Exame</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="enfermagem">Enfermagem</SelectItem>
                <SelectItem value="livre">Livre</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t mt-2">
            <Input
              placeholder="CPF / ID Paciente"
              value={cpfFilter}
              onChange={(e) => setCpfFilter(e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="ID Exame / Protocolo"
              value={examIdFilter}
              onChange={(e) => setExamIdFilter(e.target.value)}
              className="h-9 text-sm"
            />
            <Select value={triageFilter} onValueChange={setTriageFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Triagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="circunstancia_risco">Circunstância de Risco</SelectItem>
                <SelectItem value="near_miss">Near Miss</SelectItem>
                <SelectItem value="incidente_sem_dano">Incidente sem Dano</SelectItem>
                <SelectItem value="evento_adverso">Evento Adverso</SelectItem>
                <SelectItem value="evento_sentinela">Evento Sentinela</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
                    !dateStart && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateStart ? (
                    dateEnd ? `${format(dateStart, "dd/MM")} - ${format(dateEnd, "dd/MM")}` : format(dateStart, "dd/MM/yyyy")
                  ) : "Filtrar Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateStart, to: dateEnd }}
                  onSelect={(range) => {
                    setDateStart(range?.from);
                    setDateEnd(range?.to);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Unified Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold w-[140px]">Protocolo</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Pessoa Envolvida</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Triagem</TableHead>
                <TableHead className="font-semibold text-right">Data</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {isDataLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Carregando dados...
                      </div>
                    ) : (
                      "Nenhum registro encontrado."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleNavigate(item)}
                  >
                    <TableCell className="font-mono text-primary font-medium">
                      <div className="flex items-center gap-2">
                        {item.protocolo || (item.raw_data as any).protocol || "-"}
                        {(item.raw_data as any).origin === 'whatsapp' && (
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full" title="Via WhatsApp">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.normalizedType === 'administrativa' ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{item.subtipo || (item.raw_data as any).category}</Badge>
                      ) : item.normalizedType === 'enfermagem' ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{item.subtipo}</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">{typeLabels[item.normalizedType as keyof typeof typeLabels] || item.normalizedType}</Badge>
                      )}
                      {(item.raw_data as any).custom_type && <Badge variant="outline" className="ml-2 border-purple-200 text-purple-700">{(item.raw_data as any).custom_type}</Badge>}
                    </TableCell>
                    <TableCell className="text-foreground/80 font-medium">
                      {item.paciente_nome || (item.raw_data as any).employee_name || (item.raw_data as any).patient_name || (item.raw_data as any).person_name || "Não informado"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[item.status as OccurrenceStatus]?.bgColor || "bg-gray-100"} ${statusConfig[item.status as OccurrenceStatus]?.color || "text-gray-800"}`}>
                        {statusConfig[item.status as OccurrenceStatus]?.label || item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.triagem ? (
                        <TriageBadge triage={item.triagem as TriageClassification} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums text-right">
                      {format(new Date(item.criado_em), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDownloadPdf(item); }}>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
