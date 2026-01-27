import { Occurrence } from "@/types/occurrence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

interface OccurrenceTriagePanelProps {
    occurrence: Occurrence;
    isMedicalReview: boolean;
}

export function OccurrenceTriagePanel({ occurrence, isMedicalReview }: OccurrenceTriagePanelProps) {
    return (
        <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <ClipboardCheck className="h-5 w-5" />
                    Triagem e Desfecho
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-amber-300 rounded-lg">
                    <p>Funcionalidade em desenvolvimento.</p>
                    <p className="text-xs mt-1">O painel de triagem e desfecho será exibido aqui.</p>
                </div>
            </CardContent>
        </Card>
    );
}
