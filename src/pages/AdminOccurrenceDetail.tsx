import { MedicalReviewDetails } from "@/components/admin/MedicalReviewDetails";

// ... inside the component, before the return
const isMedicalReview = occurrence.type === 'assistencial' || occurrence.subtype === 'revisao_exame';

// ... inside the return JSX, inside "grid gap-6"
{
    isMedicalReview ? (
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
                        <p className="font-medium">{occurrence.type} - {occurrence.subtype}</p>
                    </div>
                    <div>
                        <span className="text-sm text-muted-foreground">Data do Registro</span>
                        <p className="font-medium">{format(new Date(occurrence.created_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                </div>
                <div>
                    <span className="text-sm text-muted-foreground">Descrição</span>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/50 rounded-lg">
                        {occurrence.description || "Sem descrição."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

{/* Attachments */ }
{
    occurrence.attachments && occurrence.attachments.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Anexos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {occurrence.attachments.map((item: any, index: number) => {
                        const url = typeof item === 'string' ? item : item.url;
                        const name = typeof item === 'string' ? `Anexo ${index + 1}` : item.name;
                        return (
                            <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted font-mono text-xs"
                            >
                                <FileText className="h-4 w-4" />
                                {name}
                            </a>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

{/* Signatures Display (if concluded) */ }
{
    isConcluded && (
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
                    {occurrence.coordinator_signature_path ? (
                        <img src={occurrence.coordinator_signature_path} alt="Assinatura Coordenador" className="max-h-20" />
                    ) : <span className="text-sm text-red-500">Não encontrada</span>}
                </div>
                <div className="border border-dashed border-green-300 rounded p-4 flex flex-col items-center bg-white/50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Colaborador</span>
                    {occurrence.employee_signature_path ? (
                        <img src={occurrence.employee_signature_path} alt="Assinatura Colaborador" className="max-h-20" />
                    ) : <span className="text-sm text-red-500">Não encontrada</span>}
                </div>
                <div className="col-span-2 text-center text-xs text-muted-foreground">
                    Assinado digitalmente em {occurrence.signed_at && format(new Date(occurrence.signed_at), "dd/MM/yyyy 'às' HH:mm")}
                </div>
            </CardContent>
        </Card>
    )
}
                </div >
            </div >
        </MainLayout >
    );
}
