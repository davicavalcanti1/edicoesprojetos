import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, PenLine, Loader2, CheckCircle2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureSectionProps {
    occurrence: any;
    onSave: (signatures: {
        assinatura_responsavel_url?: string;
        assinatura_colaborador_url?: string;
    }) => Promise<void>;
    pending: boolean;
}

export function SignatureSection({ occurrence, onSave, pending }: SignatureSectionProps) {
    const { toast } = useToast();
    const sigPadResponsavel = useRef<SignatureCanvas | null>(null);
    const sigPadColaborador = useRef<SignatureCanvas | null>(null);

    const [hasSigResponsavel, setHasSigResponsavel] = useState(!!occurrence.assinatura_responsavel_url);
    const [hasSigColaborador, setHasSigColaborador] = useState(!!occurrence.assinatura_colaborador_url);

    // If both already exist in DB, show read-only view
    const completed = occurrence.assinatura_responsavel_url && occurrence.assinatura_colaborador_url;

    const handleSaveSignatures = async () => {
        let sigResponsavelUrl = occurrence.assinatura_responsavel_url;
        let sigColaboradorUrl = occurrence.assinatura_colaborador_url;

        // Check if responsible signature is new
        if (!hasSigResponsavel && sigPadResponsavel.current && !sigPadResponsavel.current.isEmpty()) {
            sigResponsavelUrl = sigPadResponsavel.current.getTrimmedCanvas().toDataURL("image/png");
        }

        // Check if collaborator signature is new
        if (!hasSigColaborador && sigPadColaborador.current && !sigPadColaborador.current.isEmpty()) {
            sigColaboradorUrl = sigPadColaborador.current.getTrimmedCanvas().toDataURL("image/png");
        }

        if (!sigResponsavelUrl || !sigColaboradorUrl) {
            toast({
                title: "Assinaturas Obrigatórias",
                description: "Por favor, colete ambas as assinaturas antes de salvar.",
                variant: "destructive",
            });
            return;
        }

        await onSave({
            assinatura_responsavel_url: sigResponsavelUrl,
            assinatura_colaborador_url: sigColaboradorUrl
        });
    };

    const clearPad = (ref: React.MutableRefObject<SignatureCanvas | null>) => {
        if (ref.current) {
            ref.current.clear();
        }
    };

    if (completed) {
        return (
            <Card className="rounded-xl border border-green-200 bg-green-50/50 mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="h-5 w-5" />
                        Assinaturas Coletadas
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="border bg-white rounded-lg p-4">
                        <p className="text-sm font-semibold text-muted-foreground mb-4">Assinatura do Coordenador/Responsável</p>
                        <img src={occurrence.assinatura_responsavel_url} alt="Assinatura Responsável" className="max-h-24 mx-auto" />
                    </div>
                    <div className="border bg-white rounded-lg p-4">
                        <p className="text-sm font-semibold text-muted-foreground mb-4">Assinatura do Funcionário/Envolvido</p>
                        <img src={occurrence.assinatura_colaborador_url} alt="Assinatura Colaborador" className="max-h-24 mx-auto" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border border-orange-200 bg-orange-50/30 mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <PenLine className="h-5 w-5" />
                    Coleta de Assinaturas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    Para concluir esta ocorrência administrativa, é necessário coletar as assinaturas dos envolvidos.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Assinatura Responsável */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" /> Coordenador / Responsável
                        </h4>
                        {hasSigResponsavel ? (
                            <div className="border rounded-lg bg-emerald-50 border-emerald-200 p-4 relative">
                                <div className="absolute top-2 right-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                                <img src={occurrence.assinatura_responsavel_url} alt="Assinatura Gravada" className="h-24 mx-auto opacity-80" />
                                <p className="text-center text-xs text-emerald-700 mt-2 font-medium">Assinatura Salva</p>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative hover:border-primary/50 transition-colors">
                                <SignatureCanvas
                                    ref={sigPadResponsavel}
                                    penColor="black"
                                    canvasProps={{ className: "w-full h-40 bg-transparent rounded-lg cursor-crosshair" }}
                                    onEnd={() => { /* State update could be handled here if needed immediately, but checking on save is simpler */ }}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => clearPad(sigPadResponsavel)}
                                >
                                    Limpar
                                </Button>
                                <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">Assinar Aqui</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assinatura Colaborador */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <User className="h-4 w-4" /> Funcionário / Envolvido
                        </h4>
                        {hasSigColaborador ? (
                            <div className="border rounded-lg bg-emerald-50 border-emerald-200 p-4 relative">
                                <div className="absolute top-2 right-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
                                <img src={occurrence.assinatura_colaborador_url} alt="Assinatura Gravada" className="h-24 mx-auto opacity-80" />
                                <p className="text-center text-xs text-emerald-700 mt-2 font-medium">Assinatura Salva</p>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative hover:border-primary/50 transition-colors">
                                <SignatureCanvas
                                    ref={sigPadColaborador}
                                    penColor="black"
                                    canvasProps={{ className: "w-full h-40 bg-transparent rounded-lg cursor-crosshair" }}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => clearPad(sigPadColaborador)}
                                >
                                    Limpar
                                </Button>
                                <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">Assinar Aqui</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <Button onClick={handleSaveSignatures} disabled={pending} className="w-full md:w-auto">
                        {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar e Concluir Ocorrência
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Simple icon component for display
function User({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
