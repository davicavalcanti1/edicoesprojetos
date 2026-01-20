import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Clock, Zap, MessageCircle, GraduationCap, FileCog, Wrench, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Occurrence, OutcomeType, outcomeConfig } from "@/types/occurrence";

interface OutcomeKanbanProps {
  occurrences: Partial<Occurrence>[];
}

const outcomeOrder: OutcomeType[] = [
  "imediato_correcao",
  "orientacao",
  "treinamento",
  "alteracao_processo",
  "manutencao_corretiva",
  "notificacao_externa",
  "improcedente",
];

const iconMap = {
  "zap": Zap,
  "message-circle": MessageCircle,
  "graduation-cap": GraduationCap,
  "file-cog": FileCog,
  "wrench": Wrench,
  "send": Send,
  "x-circle": XCircle,
};

const outcomeColors: Record<OutcomeType, { bg: string; text: string; border: string }> = {
  imediato_correcao: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  orientacao: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  treinamento: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  alteracao_processo: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  manutencao_corretiva: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  notificacao_externa: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  improcedente: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

export function OutcomeKanban({ occurrences }: OutcomeKanbanProps) {
  const navigate = useNavigate();

  const getOccurrencesByOutcome = (outcome: OutcomeType) => {
    return occurrences.filter(
      (occ) => occ.desfecho?.tipos?.includes(outcome)
    );
  };

  return (
    <div className="flex gap-4 pb-6 overflow-x-auto min-h-[calc(100vh-250px)] w-full px-1 custom-scrollbar">
      {outcomeOrder.map((outcome) => {
        const config = outcomeConfig[outcome];
        const colors = outcomeColors[outcome];
        const Icon = iconMap[config.icon as keyof typeof iconMap];
        const items = getOccurrencesByOutcome(outcome);

        return (
          <div
            key={outcome}
            className={cn(
              "flex flex-col rounded-xl border bg-card shadow-sm h-full min-w-[280px] w-[280px] shrink-0",
              colors.border
            )}
          >
            {/* Column Header */}
            <div className={cn("p-4 border-b rounded-t-xl", colors.bg, colors.border)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", colors.text)} />
                  <h3 className={cn("font-semibold text-sm", colors.text)}>
                    {config.label}
                  </h3>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    colors.bg,
                    colors.text
                  )}
                >
                  {items.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-340px)] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {items.map((occ) => (
                <div
                  key={occ.id}
                  onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                  className="bg-background border border-border rounded-lg p-3 mb-3 hover:shadow-md cursor-pointer transition-all hover:border-primary/30 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-[10px] text-primary/80 font-medium truncate">
                      {occ.protocolo}
                    </p>
                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted/50">
                      {occ.tipo}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1 truncate group-hover:text-primary transition-colors">
                    {occ.paciente?.nomeCompleto}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(occ.criadoEm!), "dd/MM", { locale: ptBR })}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ocorrencias/${occ.id}`);
                      }}
                      className="p-1 rounded hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-lg">
                  Sem itens
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
