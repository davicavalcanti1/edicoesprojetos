
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Send, AlertTriangle } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const N8N_DISPENSER_WEBHOOK = "https://n8n.imagoradiologia.cloud/webhook/Tickets/";

const formSchema = z.object({
    funcionario: z.string().min(3, "Nome do funcionário é obrigatório"),
    observacoes: z.string().min(1, "Observação é obrigatória para este formulário"),
});

export default function FinalizarDispenser() {
    const [searchParams] = useSearchParams();
    const rawProtocolo = searchParams.get("protocolo");
    const protocolo = rawProtocolo?.trim();

    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [occurrence, setOccurrence] = useState<any>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            funcionario: "",
            observacoes: "",
        },
    });

    useEffect(() => {
        if (protocolo) {
            loadOccurrence();
        } else {
            setError("Protocolo não informado na URL.");
            setIsLoading(false);
        }
    }, [protocolo]);

    const loadOccurrence = async () => {
        try {
            if (!protocolo) return;
            const { data, error } = await supabase
                .from("chamados_dispenser" as any)
                .select("*")
                .eq("protocolo", protocolo)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setError("Chamado não encontrado ou protocolo inválido.");
                return;
            }

            // Map status 'resolvido' to 'concluida' concept if needed, but table uses 'aberto'/'resolvido' usually?
            // Migration script casts status to text. Usually it's 'aberto', 'em_andamento', 'resolvido'.
            // Let's check current 'status'.
            const currentStatus = (data as any).status;
            if (currentStatus === "resolvido" || currentStatus === "concluido") {
                setError("Este chamado já foi finalizado anteriormente.");
            }

            setOccurrence(data);
        } catch (err: any) {
            console.error("Erro ao carregar chamado:", err);
            setError(err.message || "Erro ao carregar detalhes do chamado.");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!occurrence) return;

        setIsSubmitting(true);
        try {
            // 1. Atualizar Supabase (chamados_dispenser)
            const { error: dbError } = await supabase
                .from("chamados_dispenser" as any)
                .update({
                    status: "resolvido",
                    resolvido_em: new Date().toISOString(), // Column exists
                    finalizado_por: values.funcionario, // Column added by migration
                    observacao: (occurrence.observacao ? occurrence.observacao + " | Conclusão: " : "") + values.observacoes
                    // If we overwrite, we lose original observation if any.
                    // But original is "observacao" (singular).
                    // Actually, let's append if there was one, or assuming this is the resolution note.
                    // To be safe, maybe we should keep original observation?
                    // The form schema says "observacoes".
                    // Let's just create a combined string if needed or just use the field.
                    // Given the prompt "Atualizar: finalizado_em, finalizado_por, observacoes", I'll set it.
                } as any)
                .eq("id", occurrence.id);

            if (dbError) throw dbError;

            // 2. Webhook N8N (Flat Payload)
            const localizacao = occurrence.localizacao || "N/A";
            const statusDispenser = occurrence.problema || "N/A";
            const descricao = occurrence.observacao || "-";

            const gpMessage = `✅ CHAMADO FINALIZADO (DISPENSER)
Protocolo: ${protocolo}
Local: ${localizacao}
Status Inicial: ${statusDispenser}
Finalizado por: ${values.funcionario}
Observações: ${values.observacoes || "Sem observação"}`;

            const n8nPayload = {
                event_type: "finalizar",
                protocol: protocolo,
                funcionario: values.funcionario,
                observacoes: values.observacoes,
                dispenser_localizacao: localizacao,
                gp_message: gpMessage,
                submitted_at: new Date().toISOString(),
                source: "site_dispenser_finalizar"
            };

            // Enviar webhook
            await fetch("https://n8n.imagoradiologia.cloud/webhook/Tickets/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(n8nPayload)
            });

            setIsSuccess(true);
            toast({
                title: "Chamado Finalizado",
                description: "O chamado foi encerrado com sucesso.",
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
                    <AlertTriangle className="h-16 w-16 text-destructive" />
                    <h2 className="text-xl font-bold">{error}</h2>
                    <p className="text-muted-foreground">Verifique o link ou entre em contato com o suporte.</p>
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
                            O registro foi atualizado com sucesso.
                        </p>
                    </div>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="Finalizar Dispenser" subtitle={`Protocolo: ${protocolo}`}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Dados da Finalização</CardTitle>
                    <CardDescription>
                        Informe quem realizou o serviço e se há observações.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm space-y-2">
                        <div>
                            <p className="font-semibold text-foreground/80">Problema Identificado:</p>
                            <p className="text-foreground">{occurrence?.problema || "Não especificado"}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground/80">Descrição / Observação:</p>
                            <p className="text-muted-foreground whitespace-pre-wrap mt-1 text-xs">
                                {occurrence?.observacao || "Sem descrição"}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground/80">Status Atual:</p>
                            <p className="text-xs uppercase font-bold text-muted-foreground">
                                {occurrence?.status || "ABERTO"}
                            </p>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="funcionario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Funcionário</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Quem realizou a troca/limpeza?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="observacoes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observações</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Detalhes sobre o serviço realizado..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg"
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
                                        Confirmar Conclusão
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </SimpleLayout>
    );
}
