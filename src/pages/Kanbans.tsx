import { useState } from "react";
import { Columns3, LayoutGrid, ArrowLeftRight, Loader2, Briefcase, Activity } from "lucide-react";
import { NursingKanbanBoard } from "@/components/kanban/NursingKanbanBoard";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatusKanban } from "@/components/kanban/StatusKanban";
import { OutcomeKanban } from "@/components/kanban/OutcomeKanban";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOccurrences, useUpdateOccurrenceStatus, DbOccurrence } from "@/hooks/useOccurrences";
import { OccurrenceStatus, OutcomeType, Occurrence } from "@/types/occurrence";
import { AdminKanbanBoard } from "@/components/kanban/AdminKanbanBoard";

// Transform DB occurrence to the format expected by Kanban components
function transformToKanbanFormat(occ: DbOccurrence): Partial<Occurrence> {
  return {
    id: occ.id,
    protocolo: occ.protocolo,
    tipo: occ.tipo as any,
    subtipo: occ.subtipo as any,
    status: occ.status as OccurrenceStatus,
    triagem: occ.triagem as any,
    criadoEm: occ.criado_em,
    paciente: { nomeCompleto: occ.paciente_nome_completo || "" } as any,
    desfecho: occ.desfecho_tipos?.length
      ? { tipos: occ.desfecho_tipos as OutcomeType[] } as any
      : undefined,
  };
}

export default function Kanbans() {
  const { toast } = useToast();
  const { role, isAdmin } = useAuth();
  const { data: dbOccurrences = [], isLoading } = useOccurrences();
  const updateStatus = useUpdateOccurrenceStatus();

  // If RH, default to administrative view (but here we are in generalized Kanban page)
  // Logic: 
  // - Admin: see all
  // - RH: see [Administrativo]
  // - Enfermagem: see [Enfermagem]
  // - User: see [Assistencial]

  // Default value:
  const isRh = role === 'rh';
  const isEnfermagem = role === 'enfermagem';

  const defaultTab = isRh ? 'administrativo' : isEnfermagem ? 'enfermagem' : 'assistencial';

  const occurrences = dbOccurrences.map(transformToKanbanFormat);

  const handleStatusChange = (occurrenceId: string, newStatus: OccurrenceStatus) => {
    const currentOcc = dbOccurrences.find(o => o.id === occurrenceId);
    if (!currentOcc) return;

    updateStatus.mutate({
      occurrenceId,
      currentStatus: currentOcc.status as OccurrenceStatus,
      newStatus,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Columns3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kanbans</h1>
            <p className="text-sm text-muted-foreground">
              Visualização e gestão visual das ocorrências
            </p>
          </div>
        </div>

        {/* Top Level Tabs: Assistencial vs Administrativa */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="bg-muted/50 w-full justify-start h-auto p-1">
            {(isAdmin || (!isRh && !isEnfermagem)) && (
              <TabsTrigger value="assistencial" className="gap-2 py-2">
                <Columns3 className="h-4 w-4" />
                Assistencial
              </TabsTrigger>
            )}
            {(isAdmin || isRh) && (
              <TabsTrigger value="administrativo" className="gap-2 py-2">
                <Briefcase className="h-4 w-4" />
                Administrativo
              </TabsTrigger>
            )}
            {(isAdmin || isEnfermagem) && (
              <TabsTrigger value="enfermagem" className="gap-2 py-2">
                <Activity className="h-4 w-4" />
                Enfermagem
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="assistencial" className="space-y-6">
            {/* Nested Tabs for Assistencial: Status vs Outcome */}
            <Tabs defaultValue="status" className="space-y-6">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="status" className="gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Por Status
                </TabsTrigger>
                <TabsTrigger value="outcome" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Por Desfecho
                </TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-4">
                <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/40 p-4 rounded-xl shadow-sm">
                  <p className="text-sm text-foreground font-medium">
                    {isAdmin
                      ? "Arraste os cards para alterar o status das ocorrências"
                      : "Visualização do fluxo de status das suas ocorrências"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                    <span className="font-bold text-primary">{occurrences.length}</span> ocorrências
                  </div>
                </div>

                <StatusKanban
                  occurrences={occurrences}
                  onStatusChange={handleStatusChange}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="outcome" className="space-y-4">
                <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/40 p-4 rounded-xl shadow-sm">
                  <p className="text-sm text-foreground font-medium">
                    Visualização gerencial por tipo de desfecho aplicado
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                    <span className="font-bold text-primary">
                      {occurrences.filter((o) => o.desfecho).length}
                    </span>{" "}
                    com desfecho definido
                  </div>
                </div>
                <OutcomeKanban occurrences={occurrences} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="administrativo">
            <AdminKanbanBoard />
          </TabsContent>

          <TabsContent value="enfermagem">
            <NursingKanbanBoard />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
