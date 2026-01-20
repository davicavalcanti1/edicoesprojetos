import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Loader2,
    AlertTriangle,
    Paperclip,
    FileText,
    Calendar,
    Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import imagoLogo from "@/assets/imago-logo-transparent.png";
import imagoLoginCover from "@/assets/imago-login-cover.png";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import type { Attachment } from "@/hooks/useAttachments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublicOccurrenceSimple {
    id: string;
    protocolo: string;
    paciente_nome_completo: string | null;
    paciente_data_hora_evento: string | null;
    status: string;
    public_token: string;
}

export default function PublicImageGallery() {
    const { token } = useParams<{ token: string }>();

    const [isLoading, setIsLoading] = useState(true);
    const [occurrence, setOccurrence] = useState<PublicOccurrenceSimple | null>(null);
    const [attachments, setAttachments] = useState<(Attachment & { signed_url: string | null })[]>([]);
    const [isInvalid, setIsInvalid] = useState(false);

    useEffect(() => {
        const fetchOccurrence = async () => {
            if (!token) {
                setIsInvalid(true);
                setIsLoading(false);
                return;
            }

            try {
                // Fetch occurrence by token - NO SUBTYPE FILTER, allowing any authorized PDF viewer to see images
                const { data, error } = await (supabase
                    .from("occurrences")
                    .select(
                        "id, protocolo, paciente_nome_completo, paciente_data_hora_evento, status, public_token"
                    )
                    .eq("public_token", token)
                    .maybeSingle() as any);

                if (error) {
                    console.error("Error fetching occurrence:", error);
                    setIsInvalid(true);
                } else if (!data) {
                    setIsInvalid(true);
                } else {
                    setOccurrence(data as PublicOccurrenceSimple);

                    // Fetch attachments with signed URLs
                    const { data: attachmentsData } = await supabase
                        .from("occurrence_attachments")
                        .select("*")
                        .eq("occurrence_id", data.id)
                        .order("uploaded_em", { ascending: true });

                    if (attachmentsData && attachmentsData.length > 0) {
                        // Generate signed URLs for each attachment
                        const attachmentsWithUrls = await Promise.all(
                            attachmentsData.map(async (att: any) => {
                                const { data: urlData } = await supabase.storage
                                    .from("occurrence-attachments")
                                    .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

                                return {
                                    ...att,
                                    is_image: att.is_image ?? att.file_type?.startsWith("image/"),
                                    signed_url: urlData?.signedUrl || null,
                                };
                            })
                        );
                        setAttachments(attachmentsWithUrls);
                    }
                }
            } catch (err) {
                console.error("Error:", err);
                setIsInvalid(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOccurrence();
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isInvalid) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <div className="max-w-md text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Acesso não autorizado
                    </h1>
                    <p className="text-muted-foreground">
                        O link utilizado é inválido ou expirou.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden font-sans antialiased">
            {/* Global Background */}
            <div className="fixed inset-0 z-0 select-none pointer-events-none">
                <img
                    src={imagoLoginCover}
                    alt="Background"
                    className="w-full h-full object-cover opacity-[0.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/80 to-background/95" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={imagoLogo} alt="IMAGO" className="h-10 w-auto" />
                        <div className="hidden sm:block">
                            <h1 className="font-semibold text-foreground text-lg">
                                Visualização de Evidências
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Documentos e Imagens da Ocorrência
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10 animate-fade-in">

                {/* Info Card */}
                <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-primary uppercase tracking-wide">Protocolo</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">{occurrence?.protocolo}</h2>
                    </div>

                    {occurrence?.paciente_data_hora_evento && (
                        <div className="bg-white/50 px-4 py-2 rounded-lg border border-white/20">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-0.5">
                                <Calendar className="h-4 w-4" />
                                <span>Data do Evento</span>
                            </div>
                            <p className="font-medium text-foreground">
                                {format(new Date(occurrence.paciente_data_hora_evento), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Attachments Section */}
                <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl p-8 min-h-[400px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Paperclip className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Galeria de Anexos</h3>
                    </div>

                    {attachments.length > 0 ? (
                        <AttachmentGallery
                            attachments={attachments}
                            emptyMessage="Nenhum anexo disponível"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Info className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <h3 className="text-lg font-medium text-muted-foreground">Nenhum anexo encontrado</h3>
                            <p className="text-sm text-muted-foreground/70 max-w-xs mt-1">
                                Não há imagens ou documentos vinculados a esta ocorrência no momento.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800 shadow-sm">
                    <Info className="h-5 w-5 shrink-0 text-blue-600" />
                    <p>
                        Esta é uma página segura de visualização pública gerada via QR Code. O acesso é restrito a quem possui o documento PDF original.
                    </p>
                </div>

            </main>

            {/* Footer */}
            <footer className="border-t border-white/20 bg-white/40 backdrop-blur-md mt-auto">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p className="font-medium">Imago 2026 Productions</p>
                </div>
            </footer>
        </div>
    );
}
