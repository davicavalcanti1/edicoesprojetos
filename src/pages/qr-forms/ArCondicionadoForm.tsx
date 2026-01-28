import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, CheckCircle2, AlertTriangle, Fan } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { useQueryParams } from "@/hooks/useQueryParams";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArCondicionadoParams } from "@/types/qr-forms";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
    tipo_solicitacao: z.string().min(1, "Selecione o tipo"),
    descricao: z.string().min(3, "Descreva o problema ou serviço"),
});

export default function ArCondicionadoForm() {
    const params = useQueryParams<ArCondicionadoParams>();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidQr, setIsValidQr] = useState(true);

    // Validate QR params on mount
    useEffect(() => {
        // Specific fields for AC: sala, modelo, numero_serie might be present
        if (!params.id) {
            setIsValidQr(false);
        }
    }, [params]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo_solicitacao: "",
            descricao: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // 1. Obter Tenant
            const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
            const tenantId = tenant?.id;

            if (!tenantId) throw new Error("Tenant não encontrado");

            // 2. Insert into Supabase (chamados_ar_condicionado)
            const payload = {
                localizacao: params.sala || params.localizacao || "Local Desconhecido",
                problema: values.tipo_solicitacao,
                observacao: values.descricao,
                marca: params.modelo, // Using modelo as brand/generic holder if brand not separate
                modelo: params.modelo,
                numero_serie: params.numero_serie,
                tenant_id: tenantId,
                status: "aberto"
            };

            const { data: novoChamado, error } = await supabase
                .from("chamados_ar_condicionado")
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            const protocolNum = (novoChamado as any).protocolo;

            // 3. Webhook (Using Tickets endpoint)
            const gpMessage = `❄️ *CHAMADO AR-CONDICIONADO*
Protocolo: ${protocolNum}
Local: ${payload.localizacao}
Tipo: ${values.tipo_solicitacao}
Descrição: ${values.descricao}
Modelo: ${payload.modelo || '-'} | Série: ${payload.numero_serie || '-'}
`;

            const n8nPayload = {
                event_type: "abrir_ac",
                id: (novoChamado as any).id,
                protocol: protocolNum,
                localizacao: payload.localizacao,
                tipo: values.tipo_solicitacao,
                descricao: values.descricao,
                gp_message: gpMessage,
                submitted_at: new Date().toISOString(),
                source: "site_ar_condicionado"
            };

            await fetch("https://n8n.imagoradiologia.cloud/webhook/Tickets/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(n8nPayload)
            }).catch(console.error);

            setIsSuccess(true);
            toast({
                title: "Chamado aberto!",
                description: `Protocolo: ${protocolNum}`,
            });

        } catch (error) {
            console.error("Erro ao abrir chamado:", error);
            toast({
                title: "Erro",
                description: "Não foi possível enviar o chamado. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isValidQr) {
        return (
            <SimpleLayout title="Erro de Leitura">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <AlertTriangle className="h-16 w-16 text-destructive" />
                    <h2 className="text-xl font-bold">QR Code Inválido</h2>
                    <p className="text-muted-foreground">Parâmetros do equipamento não encontrados.</p>
                </div>
            </SimpleLayout>
        );
    }

    if (isSuccess) {
        return (
            <SimpleLayout title="Solicitação Enviada">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-blue-700">Registrado!</h2>
                        <p className="text-muted-foreground mt-2">
                            Solicitação para o Ar-Condicionado da <strong>{params.sala || params.localizacao}</strong> enviada.
                        </p>
                    </div>
                    <Button onClick={() => window.close()} variant="outline" className="mt-8">
                        Fechar
                    </Button>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="Ar Condicionado" subtitle={params.sala || params.localizacao}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-100 text-sm flex gap-3 items-start">
                        <div className="bg-blue-200 p-2 rounded-full hidden sm:block">
                            <Fan className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-blue-900">Equipamento Identificado:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-800">
                                <span>Sala:</span> <span className="font-medium">{params.sala || "N/A"}</span>
                                <span>Modelo:</span> <span className="font-medium">{params.modelo || "N/A"}</span>
                                <span>Série:</span> <span className="font-medium">{params.numero_serie || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="tipo_solicitacao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Solicitação</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Manutenção IMAGO">Manutenção IMAGO</SelectItem>
                                                <SelectItem value="Manutenção terceirizada">Manutenção Terceirizada</SelectItem>
                                                <SelectItem value="Limpeza de dreno (terceirizada)">Limpeza de Dreno (Terceirizada)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição / Observações *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva o problema ou serviço necessário..."
                                                className="resize-none min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg shadow-md hover:translate-y-px transition-all bg-blue-600 hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Abrir Chamado
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
