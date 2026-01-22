
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const N8N_URLS = {
    dispenser: "https://n8n.imagoradiologia.cloud/webhook/Dispenser",
    banheiro: "https://n8n.imagoradiologia.cloud/webhook/Banheiro",
};

export default function FinalizarChamado() {
    const { protocolo } = useParams();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [occurrence, setOccurrence] = useState<any>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (protocolo) {
            loadOccurrence();
        }
    }, [protocolo]);

    const loadOccurrence = async () => {
        try {
            const { data, error } = await supabase
                .from("occurrences")
                .select("*")
                .eq("protocolo", protocolo)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Chamado não encontrado.");

            // Verifica se já está concluída
            if (data.status === "concluida") {
                setError("Este chamado já foi finalizado.");
            }

            setOccurrence(data);
        } catch (err: any) {
            console.error("Erro ao carregar chamado:", err);
            setError(err.message || "Erro ao carregar detalhes do chamado.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!occurrence) return;

        setIsSubmitting(true);
        try {
            // 1. Atualizar Supabase
            const { error: dbError } = await supabase
                .from("occurrences")
                .update({
                    status: "concluida",
                    finalizada_em: new Date().toISOString()
                })
                .eq("id", occurrence.id);

            if (dbError) throw dbError;

            // 2. Montar mensagem GP
            // Recuperar dados originais se possível (estão em dados_especificos ou descricao_detalhada)
            // Mas para finalização, o status é o mais importante.

            // Tentar extrair tipo do ticket para saber webhook
            let tipoEnvio = "tecnica"; // padrão
            // Tentamos adivinhar pelo texto ou salvar um metadado melhor. 
            // Vou usar uma busca simples na descrição ou se tivermos salvo nos metadados.
            // No passo anterior salvei: subtipo='predial', descricao_detalhada tem '[QR Code - dispenser] ...'

            let webhookType = null;
            if (occurrence.descricao_detalhada?.toLowerCase().includes("dispenser") || occurrence.subtipo === "dispenser") {
                webhookType = "dispenser";
            } else if (occurrence.descricao_detalhada?.toLowerCase().includes("banheiro") || occurrence.subtipo === "banheiro") {
                webhookType = "banheiro";
            }

            if (webhookType && N8N_URLS[webhookType as keyof typeof N8N_URLS]) {
                const gpMessage = `✅ *CHAMADO FINALIZADO*\n\n📝 Protocolo: *${protocolo}*\n📅 Finalizado em: ${new Date().toLocaleString("pt-BR")}\n\nO serviço foi concluído com sucesso.`;

                const n8nPayload = {
                    event_type: "close_ticket",
                    protocol: protocolo,
                    gp_message: gpMessage
                };

                // Enviar webhook sem esperar retorno bloqueante
                fetch(N8N_URLS[webhookType as keyof typeof N8N_URLS], {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(n8nPayload)
                }).catch(console.error);
            }

            setIsSuccess(true);
            toast({
                title: "Chamado Finalizado",
                description: "O registro foi atualizado com sucesso.",
            });

        } catch (err: any) {
            toast({
                title: "Erro",
                description: "Não foi possível finalizar o chamado. Tente novamente.",
                variant: "destructive"
            });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <SimpleLayout title="Carregando...">
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </SimpleLayout>
        );
    }

    if (error) {
        return (
            <SimpleLayout title="Atenção">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <XCircle className="h-16 w-16 text-destructive" />
                    <h2 className="text-xl font-bold">{error}</h2>
                    <Button onClick={() => window.close()} className="mt-4">
                        Fechar
                    </Button>
                </div>
            </SimpleLayout>
        );
    }

    if (isSuccess) {
        return (
            <SimpleLayout title="Chamado Finalizado">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-green-700">Concluído!</h2>
                        <p className="text-muted-foreground mt-2">
                            O chamado <strong>{protocolo}</strong> foi encerrado.
                        </p>
                    </div>
                    <Button onClick={() => window.close()} variant="outline" className="mt-8">
                        Fechar Janela
                    </Button>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="Finalizar Chamado" subtitle={`Protocolo: ${protocolo}`}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Confirmação de Execução</CardTitle>
                    <CardDescription>
                        Clique abaixo para confirmar que o serviço foi realizado e encerrar este chamado.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm">
                        <p className="font-semibold text-foreground/80">Detalhes:</p>
                        <p className="text-muted-foreground whitespace-pre-wrap mt-1">
                            {occurrence?.descricao_detalhada}
                        </p>
                    </div>

                    <Button
                        onClick={handleFinalize}
                        className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 hover:scale-[1.02] transition-all"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Finalizando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Finalizar Chamado
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </SimpleLayout>
    );
}
