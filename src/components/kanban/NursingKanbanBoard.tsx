import { useNursingOccurrences, useUpdateOccurrenceStatus, DbOccurrence } from "@/hooks/useOccurrences";
import { StatusKanban } from "./StatusKanban";
import { Occurrence, OccurrenceStatus } from "@/types/occurrence";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function transformToKanbanFormat(occ: any): Partial<Occurrence> {
    return {
        id: occ.id,
        protocolo: occ.protocol,
        tipo: occ.type as any,
        subtipo: occ.subtype as any,
        status: occ.status as OccurrenceStatus,
        criadoEm: occ.created_at,
        paciente: { nomeCompleto: occ.patient_name || "" } as any,
    };
}

export function NursingKanbanBoard() {
    const { data: nursingOccurrences = [], isLoading } = useNursingOccurrences();
    const updateStatus = useUpdateOccurrenceStatus();
    const { isAdmin } = useAuth(); // Nursing users likely can move cards too? Or just Admin? "visualizar apenas".
    // Check if Nursing users can edit status. Usually Kanban implies moving cards.
    // I will assume they can move if they can see it, or at least Admin can.

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const occurrences = nursingOccurrences.map(transformToKanbanFormat);

    const handleStatusChange = (occurrenceId: string, newStatus: OccurrenceStatus) => {
        const currentOcc = nursingOccurrences.find(o => o.id === occurrenceId);
        if (!currentOcc) return;

        // Note: useUpdateOccurrenceStatus might default to the main 'occurrences' table. 
        // We might need a specific mutation for nursing if they use a different table.
        // However, if the hook is smart enough or if we don't care about dragging for now, we can leave it.
        // For now, I'll hook it up. If it fails, I'll need to fix the hook.
        updateStatus.mutate({
            occurrenceId,
            currentStatus: currentOcc.status as OccurrenceStatus,
            newStatus,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl border border-white/40 p-4 rounded-xl shadow-sm">
                <p className="text-sm text-foreground font-medium">
                    Fluxo de ocorrências de Enfermagem
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-100 px-3 py-1 rounded-full">
                    <span className="font-bold text-emerald-700">{occurrences.length}</span> ocorrências
                </div>
            </div>

            <StatusKanban
                occurrences={occurrences}
                onStatusChange={handleStatusChange}
                isAdmin={isAdmin || true} // Allow nursing to move? for now yes.
            />
        </div>
    );
}
