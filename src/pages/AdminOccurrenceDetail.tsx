
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ArrowLeft, FileText, Calendar, User, AlignLeft,
    Paperclip, CheckCircle2, AlertCircle, Printer
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/ui/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadAdminOccurrencePDF } from "@/lib/pdf/admin-occurrence-pdf";

export default function AdminOccurrenceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [occurrence, setOccurrence] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signatures, setSignatures] = useState<{ coordinator: string | null; employee: string | null }>({
        coordinator: null,
        employee: null,
    });

    useEffect(() => {
        if (id) fetchOccurrence();
    }, [id]);

    const fetchOccurrence = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("administrative_occurrences" as any)
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            toast({
                title: "Erro ao carregar",
                description: "Não foi possível carregar a ocorrência.",
                variant: "destructive",
            });
            navigate("/ocorrencias");
        } else {
            setOccurrence(data);
            // If already signed, pre-fill? No, they come from DB as paths potentially?
            // For now we just check if they exist in DB to determine status, 
            // but if we are collecting new ones we use state.
        }
        setIsLoading(false);
    };

    const handleSignatureSave = async (role: 'coordinator' | 'employee', dataUrl: string) => {
        setSignatures(prev => ({ ...prev, [role]: dataUrl }));
    };

    const submitSignatures = async () => {
        if (!signatures.coordinator || !signatures.employee) {
            toast({
                title: "Assinaturas pendentes",
                description: "Ambas as assinaturas (Coordenador e Colaborador) são obrigatórias.",
                variant: "destructive"
            });
            return;
        }

        try {
            // 1. Upload images to storage (optional, or save dataURL directly if small? 
            // DataURLs are large text. Better to upload.
            // But for simplicity/speed let's assume we can save to text field or upload.
            // Implementation plan said "coordinator_signature_path".

            const uploadSignature = async (dataUrl: string, name: string) => {
                const blob = await (await fetch(dataUrl)).blob();
                const fileName = `signatures/${id}/${name}_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage
                    .from('occurrence-attachments')
                    .upload(fileName, blob);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data } = supabase.storage.from('occurrence-attachments').getPublicUrl(fileName);
                return data.publicUrl;
            };

            const coordUrl = await uploadSignature(signatures.coordinator, 'coordinator');
            const empUrl = await uploadSignature(signatures.employee, 'employee');

            // 2. Update Record
            const { error } = await supabase
                .from("administrative_occurrences" as any)
                .update({
                    coordinator_signature_path: coordUrl,
                    employee_signature_path: empUrl,
                    status: 'concluido',
                    signed_at: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Assinaturas salvas e ocorrência concluída.",
            });
            setSignatureModalOpen(false);
            fetchOccurrence(); // Refresh

        } catch (error: any) {
            console.error(error);
            toast({ title: "Erro", description: "Falha ao salvar assinaturas.", variant: "destructive" });
        }
    };

    if (isLoading || !occurrence) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">Loading...</div>
            </MainLayout>
        );
    }

    const isConcluded = occurrence.status === 'concluido';

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto pb-20">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {occurrence.protocol || "Protocolo Pendente"}
                        </h1>
                        <div className="flex gap-2">
                            <Badge variant="outline">{occurrence.type}</Badge>
                            <Badge className={isConcluded ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                {isConcluded ? "Concluída" : "Pendente de Assinatura"}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => downloadAdminOccurrencePDF(occurrence)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Gerar PDF
                        </Button>

                        {!isConcluded && (
                            <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Coletar Assinaturas
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Coleta de Assinaturas</DialogTitle>
                                        <DialogDescription>
                                            As assinaturas serão salvas e a ocorrência será finalizada.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-6 py-4">
                                        <div>
                                            <h3 className="font-medium mb-2">Assinatura do Coordenador</h3>
                                            <SignaturePad
                                                label="Assine aqui (Coordenador)"
                                                onSave={(data) => handleSignatureSave('coordinator', data)}
                                            />
                                            {signatures.coordinator && <p className="text-xs text-green-600 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />Capturada</p>}
                                        </div>
                                        <Separator />
                                        <div>
                                            <h3 className="font-medium mb-2">Assinatura do Colaborador: {occurrence.employee_name}</h3>
                                            <SignaturePad
                                                label="Assine aqui (Colaborador)"
                                                onSave={(data) => handleSignatureSave('employee', data)}
                                            />
                                            {signatures.employee && <p className="text-xs text-green-600 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />Capturada</p>}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSignatureModalOpen(false)}>Cancelar</Button>
                                        <Button onClick={submitSignatures} disabled={!signatures.coordinator || !signatures.employee}>
                                            Finalizar Ocorrência
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Dados do Funcionário
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Nome</span>
                                <p className="font-medium">{occurrence.employee_name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
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

                    {/* Attachments */}
                    {occurrence.attachments && occurrence.attachments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Paperclip className="h-5 w-5" />
                                    Anexos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {occurrence.attachments.map((url: string, index: number) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted font-mono text-xs"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Anexo {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Signatures Display (if concluded) */}
                    {isConcluded && (
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
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
