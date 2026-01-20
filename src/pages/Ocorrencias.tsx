import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Filter, Eye, Loader2, Briefcase } from "lucide-react";
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
  OccurrenceStatus,
  OccurrenceType,
  statusConfig,
  TriageClassification,
} from "@/types/occurrence";
import { useOccurrences, useAdministrativeOccurrences, useNursingOccurrences, usePatientOccurrencesList } from "@/hooks/useOccurrences";
import { downloadOccurrencePDF } from "@/lib/pdf/occurrence-pdf";
import { downloadAdminOccurrencePDF } from "@/lib/pdf/admin-occurrence-pdf";
import { useAuth } from "@/contexts/AuthContext";

const typeLabels: Record<OccurrenceType, string> = {
  administrativa: "Administrativa",
  revisao_exame: "Revisão de Exame",
  enfermagem: "Enfermagem",
};

export default function Ocorrencias() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Context: 'revisao_exame' (replacing assistencial), 'enfermagem', 'administrativa', 'paciente', or 'livre'
  const [listContext, setListContext] = useState<'revisao_exame' | 'enfermagem' | 'administrativa' | 'paciente' | 'livre'>('revisao_exame');

  // Initialize context based on role
  useEffect(() => {
    if (role === 'rh') {
      setListContext('administrativa');
    } else if (role === 'enfermagem') {
      setListContext('enfermagem');
    } else if (role === 'user') {
      setListContext('revisao_exame'); // Default for users (likely radiologists/technicians)
    }
  }, [role]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sexFilter, setSexFilter] = useState<string>("all"); // Specific to Assistencial
  const [examFilter, setExamFilter] = useState(""); // Specific to Assistencial
  const [doctorFilter, setDoctorFilter] = useState(""); // Specific to Assistencial
  const [cpfFilter, setCpfFilter] = useState(""); // Specific to Assistencial

  // Queries
  const { data: assistencialOccurrences = [], isLoading: isLoadingAssistencial } = useOccurrences();
  const { data: adminOccurrences = [], isLoading: isLoadingAdmin } = useAdministrativeOccurrences();
  const { data: nursingOccurrences = [], isLoading: isLoadingNursing } = useNursingOccurrences();
  const { data: patientOccurrences = [], isLoading: isLoadingPatient } = usePatientOccurrencesList();

  const filteredOccurrences = (() => {
    if (listContext === 'administrativa') {
      return adminOccurrences.filter((occ) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (occ.protocol || "").toLowerCase().includes(searchLower) ||
          (occ.employee_name || "").toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === "all" || occ.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    } else if (listContext === 'enfermagem') {
      return nursingOccurrences.filter((occ) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (occ.protocol || "").toLowerCase().includes(searchLower) ||
          (occ.patient_name || "").toLowerCase().includes(searchLower); // patient_name in nursing table
        const matchesStatus = statusFilter === "all" || occ.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    } else if (listContext === 'paciente') {
      return patientOccurrences.filter((occ) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (occ.protocolo || "").toLowerCase().includes(searchLower) ||
          (occ.paciente_nome_completo || "").toLowerCase().includes(searchLower) ||
          (occ.descricao_detalhada || "").toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === "all" || occ.status === statusFilter; // 'pendente' usually
        return matchesSearch && matchesStatus;
      });
    } else if (listContext === 'livre') {
      // Filter for 'livre' type occurrences (which are in the same 'assistencialOccurrences' or 'adminOccurrences' bucket?
      // Actually, 'useOccurrences' fetches *all* non-admin/non-nursing? Or does it?
      // Let's check 'useOccurrences' hook. It fetches from 'occurrences'.
      // If 'livre' is in 'occurrences' table, it should be in 'assistencialOccurrences' if not filtered out by RLS or queries.
      // Assuming 'useOccurrences' returns everything from 'occurrences' table.
      return assistencialOccurrences.filter((occ) => {
        if (occ.tipo !== 'livre') return false;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (occ.protocolo || "").toLowerCase().includes(searchLower) ||
          (occ.custom_type || "").toLowerCase().includes(searchLower) ||
          (occ.descricao_detalhada || "").toLowerCase().includes(searchLower);

        return matchesSearch;
      });
    } else {
      // Revisao de Exame (legacy table)
      return assistencialOccurrences.filter((occ) => {
        if (occ.tipo !== 'revisao_exame' && occ.tipo !== 'assistencial') return false;

        const matchesSearch =
          occ.protocolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          occ.paciente_nome_completo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || occ.status === statusFilter;
        const matchesType = typeFilter === "all" || occ.tipo === typeFilter;
        const matchesSex = sexFilter === "all" || occ.paciente_sexo === sexFilter;
        const matchesExam = !examFilter || occ.paciente_tipo_exame?.toLowerCase().includes(examFilter.toLowerCase());
        const matchesDoctor = !doctorFilter || occ.medico_destino?.toLowerCase().includes(doctorFilter.toLowerCase());
        const matchesCpf = !cpfFilter || occ.paciente_id?.includes(cpfFilter);

        return matchesSearch && matchesStatus && matchesType && matchesSex && matchesExam && matchesDoctor && matchesCpf;
      });
    }
  })();

  const isLoading =
    listContext === 'administrativa' ? isLoadingAdmin :
      listContext === 'enfermagem' ? isLoadingNursing :
        isLoadingAssistencial;

  const handleDownloadPdf = (occ: any) => {
    if (listContext === 'administrativa') {
      downloadAdminOccurrencePDF(occ);
    } else if (listContext === 'enfermagem') {
      // Enfermagem uses specific table but uses standard PDF for now?
      // We need to map fields or update PDF generator.
      // For now, map fields to match what PDF expects from "legacy"
      const transformedOcc = {
        ...occ,
        protocolo: occ.protocol,
        tipo: occ.type,
        subtipo: occ.subtype,
        paciente_nome_completo: occ.patient_name,
        paciente_id: occ.patient_id,
        paciente_data_hora_evento: occ.occurrence_date,
        descricao_detalhada: occ.description,
        // Add other mappings as needed
        paciente: {
          nomeCompleto: occ.patient_name,
          idPaciente: occ.patient_id,
          dataHoraEvento: occ.occurrence_date,
        }
      };
      downloadOccurrencePDF(transformedOcc as any);
    } else {
      // For revisao_exame
      const transformedOcc = {
        ...occ,
        paciente: {
          nomeCompleto: occ.paciente_nome_completo,
          idPaciente: occ.paciente_id,
          telefone: occ.paciente_telefone,
          unidadeLocal: occ.paciente_unidade_local,
          dataHoraEvento: occ.paciente_data_hora_evento,
          sexo: occ.paciente_sexo,
          tipoExame: occ.paciente_tipo_exame
        }
      };
      downloadOccurrencePDF(transformedOcc as any);
    }
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${listContext === 'administrativa' ? 'bg-amber-100' : 'bg-primary/10'}`}>
              {listContext === 'administrativa' ? (
                <Briefcase className="h-5 w-5 text-amber-600" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {listContext === 'administrativa' ? 'Ocorrências Administrativas (RH)' :
                  listContext === 'enfermagem' ? 'Ocorrências de Enfermagem' :
                    'Ocorrências Assistenciais'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie os registros
              </p>
            </div>

            {/* New Button for Free Occurrence */}
            <Button
              variant="outline"
              size="sm"
              className="ml-4 gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => navigate('/ocorrencias/nova-livre')}
            >
              <FileText className="h-4 w-4" />
              Nova Ocorrência Livre
            </Button>
          </div>

          {/* Context Switcher for Admin */}
          {role === 'admin' && (
            <div className="flex bg-muted rounded-lg p-1 gap-1">
              <Button
                variant={listContext === 'revisao_exame' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setListContext('revisao_exame')}
                className="text-xs"
              >
                Revisão
              </Button>
              <Button
                variant={listContext === 'enfermagem' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setListContext('enfermagem')}
                className="text-xs"
              >
                Enfermagem
              </Button>
              <Button
                variant={listContext === 'administrativa' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setListContext('administrativa')}
                className="text-xs"
              >
                Administrativa
              </Button>
              <Button
                variant={listContext === 'paciente' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setListContext('paciente')}
                className="text-xs"
              >
                Paciente
              </Button>
              <Button
                variant={listContext === 'livre' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setListContext('livre')}
                className="text-xs"
              >
                Livre
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  listContext === 'revisao_exame' ? "Buscar por protocolo ou paciente..." :
                    listContext === 'enfermagem' ? "Buscar por protocolo ou paciente..." :
                      listContext === 'paciente' ? "Buscar por protocolo, nome..." :
                        listContext === 'livre' ? "Buscar por protocolo, tipo, descrição..." :
                          "Buscar por protocolo ou funcionário..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-background">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {/* Reuse status config for now, assuming Admin has similar basic statuses or text match */}
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {listContext === 'revisao_exame' && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="revisao_exame">Revisão de Exame</SelectItem>
                    <SelectItem value="enfermagem">Enfermagem</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {listContext === 'revisao_exame' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Filtro por CPF/ID..."
                value={cpfFilter}
                onChange={(e) => setCpfFilter(e.target.value)}
                className="bg-background"
              />
              <Input
                placeholder="Filtro por Exame..."
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="bg-background"
              />
              <Input
                placeholder="Médico Responsável..."
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="bg-background"
              />
              <Select value={sexFilter} onValueChange={setSexFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os sexos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <TableHead className="font-semibold">{listContext === 'administrativa' ? 'Categoria' : listContext === 'livre' ? 'Tipo Manual' : 'Tipo'}</TableHead>
                <TableHead className="font-semibold">
                  {listContext === 'administrativa' ? 'Funcionário' :
                    listContext === 'livre' ? 'Envolvido' :
                      'Paciente'}
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                {listContext === 'revisao_exame' && <TableHead className="font-semibold">Triagem</TableHead>}
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOccurrences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhuma ocorrência encontrada
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOccurrences.map((occ) => (
                  <TableRow
                    key={occ.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      if (listContext === 'revisao_exame') {
                        navigate(`/ocorrencias/${occ.id}`);
                      } else if (listContext === 'enfermagem') {
                        navigate(`/ocorrencias/enfermagem/${occ.id}`);
                      } else if (listContext === 'livre' || listContext === 'paciente') {
                        navigate(`/ocorrencias/${occ.id}`);
                      } else {
                        navigate(`/ocorrencias/admin/${occ.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-mono font-medium text-primary">
                      {(listContext === 'revisao_exame' || listContext === 'paciente') ? (occ.protocolo || occ.protocol) : occ.protocol}
                    </TableCell>
                    <TableCell>
                      {listContext === 'revisao_exame' ? (
                        <Badge variant={occ.tipo as any}>
                          {typeLabels[occ.tipo as OccurrenceType]}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium">
                          {(listContext === 'paciente') ? (
                            <Badge variant="outline">Paciente</Badge>
                          ) : (occ.tipo === 'livre' && occ.custom_type) ? (
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                              {occ.custom_type}
                            </Badge>
                          ) : (
                            occ.type
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(listContext === 'revisao_exame' || listContext === 'paciente')
                        ? (occ.paciente_nome_completo || "-")
                        : listContext === 'livre'
                          ? (occ.paciente_nome_completo || occ.employee_name || (occ.related_employee_id ? "Funcionário" : "Não informado"))
                          : (occ.employee_name || "-")
                      }
                    </TableCell>
                    <TableCell>
                      {listContext === 'revisao_exame' ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[occ.status as OccurrenceStatus]?.bgColor || "bg-gray-100"
                            } ${statusConfig[occ.status as OccurrenceStatus]?.color || "text-gray-800"}`}
                        >
                          {statusConfig[occ.status as OccurrenceStatus]?.label || occ.status}
                        </span>
                      ) : (
                        <Badge variant="outline">{occ.status}</Badge>
                      )}
                    </TableCell>
                    {listContext === 'revisao_exame' && (
                      <TableCell>
                        {occ.triagem ? (
                          <TriageBadge triage={occ.triagem as TriageClassification} size="sm" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Pendente</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {(() => {
                        const dateStr = listContext === 'revisao_exame' ? occ.criado_em : occ.created_at;
                        try {
                          return dateStr ? format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR }) : "-";
                        } catch (e) {
                          return "-";
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Always show Download PDF for Admin / Completed */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Baixar PDF"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPdf(occ);
                          }}
                        >
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (listContext === 'revisao_exame') {
                              navigate(`/ocorrencias/${occ.id}`);
                            } else if (listContext === 'enfermagem') {
                              navigate(`/ocorrencias/enfermagem/${occ.id}`);
                            } else {
                              navigate(`/ocorrencias/admin/${occ.id}`);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
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
