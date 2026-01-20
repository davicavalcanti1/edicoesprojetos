import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { GripVertical, Eye, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TriageBadge } from "@/components/triage/TriageBadge";
import {
  Occurrence,
  OccurrenceStatus,
  statusConfig,
  statusTransitions,
  TriageClassification,
} from "@/types/occurrence";

interface StatusKanbanProps {
  occurrences: Partial<Occurrence>[];
  onStatusChange?: (occurrenceId: string, newStatus: OccurrenceStatus) => void;
  isAdmin?: boolean;
}

const statusOrder: OccurrenceStatus[] = [
  "registrada",
  "em_triagem",
  "em_analise",
  "acao_em_andamento",
  "concluida",
  "improcedente",
];

export function StatusKanban({
  occurrences,
  onStatusChange,
  isAdmin = false,
}: StatusKanbanProps) {
  const navigate = useNavigate();

  const getOccurrencesByStatus = (status: OccurrenceStatus) => {
    return occurrences.filter((occ) => occ.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isAdmin) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as OccurrenceStatus;
    const occurrence = occurrences.find((o) => o.id === draggableId);

    if (occurrence && occurrence.status) {
      const validTransitions = statusTransitions[occurrence.status];
      if (validTransitions.includes(newStatus)) {
        onStatusChange?.(draggableId, newStatus);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 pb-6 overflow-x-auto min-h-[calc(100vh-250px)] w-full px-1 custom-scrollbar">
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const items = getOccurrencesByStatus(status);

          return (
            <div
              key={status}
              className="flex flex-col rounded-xl border border-border bg-card shadow-sm h-full min-w-[300px] w-[300px] shrink-0"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "p-4 border-b border-border rounded-t-xl",
                  config.bgColor
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-semibold text-sm", config.color)}>
                    {config.label}
                  </h3>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      config.bgColor,
                      config.color
                    )}
                  >
                    {items.length}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">
                  {config.description}
                </p>
              </div>

              {/* Column Content */}
              <Droppable droppableId={status} isDropDisabled={!isAdmin}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-3 flex-1 transition-colors overflow-y-auto max-h-[calc(100vh-380px)] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {items.map((occ, index) => (
                      <Draggable
                        key={occ.id}
                        draggableId={occ.id!}
                        index={index}
                        isDragDisabled={!isAdmin}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-background border border-border rounded-lg p-3 mb-3 transition-all",
                              snapshot.isDragging && "shadow-xl ring-2 ring-primary rotate-2 scale-105 z-50",
                              !snapshot.isDragging && "hover:shadow-md hover:border-primary/30",
                              isAdmin && "cursor-grab active:cursor-grabbing",
                              "group"
                            )}
                            onClick={() => !snapshot.isDragging && navigate(`/ocorrencias/${occ.id}`)}
                          >
                            <div className="flex items-start gap-2">
                              {isAdmin && (
                                <div className="mt-1 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-mono text-[10px] text-primary/80 font-medium truncate">
                                    {occ.protocolo}
                                  </p>
                                  {occ.triagem && (
                                    <TriageBadge
                                      triage={occ.triagem as TriageClassification}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                  {occ.paciente?.nomeCompleto}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className={cn("text-[10px] h-5 border-dashed",
                                    occ.tipo === "assistencial" ? "text-blue-600 border-blue-200 bg-blue-50" : "text-gray-600 border-gray-200 bg-gray-50"
                                  )}>
                                    {occ.tipo === "assistencial" ? "Assistencial" : "Outro"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(occ.criadoEm!), "dd/MM 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-lg">
                        Sem itens
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
