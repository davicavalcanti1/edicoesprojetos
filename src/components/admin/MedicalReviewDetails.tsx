
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Stethoscope, User, Calendar, FileText, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicalReviewDetailsProps {
    occurrence: any;
}

export function MedicalReviewDetails({ occurrence }: MedicalReviewDetailsProps) {
    // Parse dados_especificos if it's a string, otherwise use it as is
    let details: any = {};
    try {
        if (typeof occurrence.dados_especificos === 'string') {
            details = JSON.parse(occurrence.dados_especificos);
        } else {
            details = occurrence.dados_especificos || {};
        }
    } catch (e) {
        console.error("Error parsing dados_especificos", e);
        // Fallback to description if it's JSON
        try {
            if (typeof occurrence.description === 'string' && occurrence.description.startsWith('{')) {
                details = JSON.parse(occurrence.description);
            }
        } catch (e2) { }
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Dados do Paciente
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-muted-foreground">Nome do Paciente</span>
                        <p className="font-medium text-lg">{occurrence.paciente_nome_completo || occurrence.patient_name || details.pacienteName || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Data de Nascimento</span>
                        <p className="font-medium">
                            {occurrence.paciente_data_nascimento
                                ? format(new Date(occurrence.paciente_data_nascimento), "dd/MM/yyyy")
                                : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Telefone</span>
                        <p className="font-medium">{occurrence.paciente_telefone || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Unidade</span>
                        <p className="font-medium">{occurrence.paciente_unidade_local || "-"}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Detalhes do Exame
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-sm text-muted-foreground">Modalidade</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{details.exameModalidade || "-"}</Badge>
                            {details.exameRegiao && <Badge variant="secondary">{details.exameRegiao}</Badge>}
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Data do Exame</span>
                        <p className="font-medium">
                            {details.exameData
                                ? format(new Date(details.exameData), "dd/MM/yyyy")
                                : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Médico Responsável (Laudo)</span>
                        <p className="font-medium">{details.medicoResponsavel || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Laudo Entregue?</span>
                        <p className="font-medium capitalize">{details.laudoEntregue || "-"}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Motivo da Revisão
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <span className="text-sm text-muted-foreground">Motivo</span>
                        <p className="font-medium text-lg">{details.motivoRevisao || "-"}</p>
                    </div>

                    {details.tipoDiscrepancia && (
                        <div>
                            <span className="text-sm text-muted-foreground">Discrepância / Detalhes</span>
                            <p className="mt-1 p-3 bg-muted rounded-md text-sm">{details.tipoDiscrepancia}</p>
                        </div>
                    )}

                    {details.impactoDescricao && (
                        <div>
                            <span className="text-sm text-muted-foreground">Impacto Percebido</span>
                            <p className="mt-1 text-sm">{details.impactoDescricao}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legacy Description field if not parsed above */}
            {(!details.tipoDiscrepancia && occurrence.description && !occurrence.description.startsWith('{')) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Descrição Adicional
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{occurrence.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Doctor's Opinion Display */}
            {occurrence.mensagem_medico && (
                <Card className="border-l-4 border-l-blue-500 bg-blue-50/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                            <Stethoscope className="h-5 w-5" />
                            Parecer Médico
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground">Médico Responsável:</span> {occurrence.medico_destino || "Não identificado"}
                        </div>
                        <div className="bg-white/50 p-4 rounded-md border border-blue-100">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{occurrence.mensagem_medico}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Outcome / Desfecho */}
            {(occurrence.desfecho_principal || occurrence.desfecho_justificativa) && (
                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                            <CheckCircleIcon className="h-5 w-5" />
                            Conclusão e Desfecho
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {occurrence.desfecho_principal && (
                            <div>
                                <span className="text-sm text-muted-foreground">Ação Principal</span>
                                <p className="font-medium">{occurrence.desfecho_principal}</p>
                            </div>
                        )}
                        {occurrence.desfecho_justificativa && (
                            <div>
                                <span className="text-sm text-muted-foreground">Justificativa / Observações</span>
                                <p className="mt-1 text-sm">{occurrence.desfecho_justificativa}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
