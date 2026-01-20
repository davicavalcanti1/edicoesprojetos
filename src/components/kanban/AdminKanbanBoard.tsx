import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdministrativeOccurrences } from "@/hooks/useOccurrences";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type KanbanStatus = "pendente" | "concluido";

interface KanbanColumn {
    id: KanbanStatus;
    title: string;
    items: any[];
}

export function AdminKanbanBoard() {
    const navigate = useNavigate();
    const { data: occurrences = [], isLoading } = useAdministrativeOccurrences();
    const [columns, setColumns] = useState<KanbanColumn[]>([
        { id: "pendente", title: "Pendente / Em Assinatura", items: [] },
        { id: "concluido", title: "Concluído", items: [] },
    ]);

    useEffect(() => {
        if (occurrences.length > 0) {
            const pendente = occurrences.filter(
                (o) => o.status === "aberto" || o.status === "em_andamento"
            );
            const concluido = occurrences.filter((o) => o.status === "concluido");

            setColumns([
                { id: "pendente", title: "Pendente / Em Assinatura", items: pendente },
                { id: "concluido", title: "Concluído", items: concluido },
            ]);
        }
    }, [occurrences]);

    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="flex items-center justify-end mb-6">
                <Button onClick={() => navigate("/ocorrencias/nova/administrativa")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Ocorrência
                </Button>
            </div>

            {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-6 h-full min-w-[1100px]">
                        {columns.map((column) => (
                            <div key={column.id} className="flex-1 min-w-[350px] flex flex-col bg-muted/30 rounded-xl border border-border/50">
                                <div className={`p-4 border-b ${column.id === 'pendente' ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'} rounded-t-xl`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-semibold ${column.id === 'pendente' ? 'text-amber-800' : 'text-green-800'}`}>
                                            {column.title}
                                        </h3>
                                        <Badge variant="secondary" className="bg-white/80">
                                            {column.items.length}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-350px)]">
                                    {column.items.map((item) => (
                                        <Card
                                            key={item.id}
                                            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary"
                                            onClick={() => navigate(`/ocorrencias/admin/${item.id}`)}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground mb-2">
                                                        {item.protocol || "SEM PROTOCOLO"}
                                                    </Badge>
                                                    {column.id === 'pendente' && (
                                                        <div className="flex items-center text-xs text-amber-600 font-medium">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Assinatura Pendente
                                                        </div>
                                                    )}
                                                </div>
                                                <CardTitle className="text-base font-medium line-clamp-1">
                                                    {item.employee_name}
                                                </CardTitle>
                                                <CardDescription className="text-xs line-clamp-1">
                                                    {item.type} - {item.subtype}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                    <div className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                    </div>
                                                    {column.id === 'concluido' && (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {column.items.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                            <FileText className="h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">Nenhuma ocorrência</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
