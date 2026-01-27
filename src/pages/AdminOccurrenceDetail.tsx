import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOccurrence, useUpdateOccurrenceStatus } from "@/hooks/useOccurrences";
import { useAttachmentsWithSignedUrls } from "@/hooks/useAttachments";
import { MainLayout } from "@/components/layout/MainLayout";
import { MedicalReviewDetails } from "@/components/admin/MedicalReviewDetails";
import { OccurrenceTriagePanel } from "@/components/admin/OccurrenceTriagePanel";
import { SendToDoctorModal } from "@/components/occurrence/SendToDoctorModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle2, FileText, Paperclip, AlignLeft, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOccurrenceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: occurrence, isLoading } = useOccurrence(id);
    const updateStatus = useUpdateOccurrenceStatus();

    // Local state for modals and panels
    const [sendToDoctorOpen, setSendToDoctorOpen] = useState(false);

    // Safety check for original_table, defaulting to empty string so hook handles enabled check
    const originTable = (occurrence as any)?.original_table || "";

    const { data: attachments } = useAttachmentsWithSignedUrls(id, originTable);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    Carregando...
                </div>
            </MainLayout>
        )
    }

    if (!occurrence) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p>Ocorrência não encontrada</p>
                    <Button onClick={() => navigate("/ocorrencias")}>Voltar</Button>
                </div>
            </MainLayout>
        )
    }

    const isMedicalReview =
        occurrence.tipo === 'assistencial' ||
        occurrence.subtipo === 'revisao_exame' ||
        (occurrence as any).type === 'assistencial' ||
        (occurrence as any).subtype === 'revisao_exame';

    const isConcluded = occurrence.status === 'concluida';
    const showTriagePanel = occurrence.status === 'em_analise' || occurrence.status === 'aguardando_triagem' || occurrence.status === 'em_triagem';

    return (
        <MainLayout>
            <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Ocorrência {occurrence.protocolo}
                        {occurrence.status && (
                            <span className="ml-3 text-sm font-normal px-2 py-1 bg-muted rounded-full">
                                {occurrence.status}
                            </span>
                        )}
                    </h1>

                    {/* ACTIONS BAR */}
                    <div className="ml-auto flex items-center gap-2">
                        {/* Action: Send to Doctor */}
                        {occurrence.status === 'aguardando_envio' && (
                            <Button
                                onClick={() => setSendToDoctorOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar para Médico
                            </Button>
                        )}

                        {/* Action: Mark as Unfounded (Available in early stages) */}
                        {(occurrence.status === 'aguardando_envio' || occurrence.status === 'registrada') && (
                            <Button
                                variant="outline"
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => {
                                    if (confirm("Tem certeza que deseja marcar esta ocorrência como improcedente?")) {
                                        updateStatus.mutate({
                                            id: occurrence.id,
                                            status: 'improcedente',
                                            original_table: (occurrence as any).original_table
                                        });
                                    }
                                }}
                                disabled={updateStatus.isPending}
                            >
                                Marcar como Improcedente
                            </Button>
                        )}
                    </div>
                </div>

                {/* Send To Doctor Modal */}
                <SendToDoctorModal
                    open={sendToDoctorOpen}
                    onOpenChange={setSendToDoctorOpen}
                    occurrenceId={occurrence.id}
                    protocolo={occurrence.protocolo}
                    pacienteNome={occurrence.paciente_nome}
                    pacienteTipoExame={(occurrence as any).paciente?.tipoExame || (occurrence as any).raw_data?.dados_especificos?.exameModalidade}
                    pacienteUnidade={(occurrence as any).paciente?.unidadeLocal || (occurrence as any).raw_data?.dados_especificos?.unidadeLocal}
                    pacienteDataHoraEvento={(occurrence as any).paciente?.dataHoraEvento}
                    onSuccess={() => {
                        // Invalidate query to refresh status
                        // Simplified: The list view will update, for details view react-query might auto-refetch or we can force it
                        window.location.reload();
                    }}
                />

                {/* Triage Panel - Show if status is ready for triage */}
                {showTriagePanel && !isConcluded && (
                    <OccurrenceTriagePanel occurrence={occurrence} isMedicalReview={isMedicalReview} />
                )}

                {isMedicalReview ? (
                    <MedicalReviewDetails occurrence={occurrence} />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlignLeft className="h-5 w-5" />
                                Detalhes do Registro
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Tipo de Ocorrência</span>
                                    <p className="font-medium capitalize">{occurrence.tipo} - {occurrence.subtipo}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Data do Registro</span>
                                    <p className="font-medium">
                                        {occurrence.criado_em && format(new Date(occurrence.criado_em), "dd/MM/yyyy HH:mm")}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Descrição</span>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/50 rounded-lg">
                                    {occurrence.descricao || "Sem descrição."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Attachments */}
                {attachments && attachments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Paperclip className="h-5 w-5" />
                                Anexos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((item: any, index: number) => {
                                    return (
                                        <a
                                            key={item.id || index}
                                            href={item.signed_url || item.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted font-mono text-xs"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {item.file_name || `Anexo ${index + 1}`}
                                        </a>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Signatures */}
                {isConcluded && ((occurrence as any).coordinator_signature_path || (occurrence as any).employee_signature_path) && (
                    <Card className="border-green-200 bg-green-50/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                                <CheckCircle2 className="h-5 w-5" />
                                Assinaturas Registradas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="border border-dashed border-green-300 rounded p-4 flex flex-col items-center bg-white/50">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Coordenador</span>
                                {(occurrence as any).coordinator_signature_path ? (
                                    <img src={(occurrence as any).coordinator_signature_path} alt="Assinatura Coordenador" className="max-h-20" />
                                ) : <span className="text-sm text-red-500">Não encontrada</span>}
                            </div>
                            <div className="border border-dashed border-green-300 rounded p-4 flex flex-col items-center bg-white/50">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Colaborador</span>
                                {(occurrence as any).employee_signature_path ? (
                                    <img src={(occurrence as any).employee_signature_path} alt="Assinatura Colaborador" className="max-h-20" />
                                ) : <span className="text-sm text-red-500">Não encontrada</span>}
                            </div>
                            <div className="col-span-2 text-center text-xs text-muted-foreground">
                                Assinado digitalmente em {(occurrence as any).signed_at && format(new Date((occurrence as any).signed_at), "dd/MM/yyyy 'às' HH:mm")}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout >
    );
}
