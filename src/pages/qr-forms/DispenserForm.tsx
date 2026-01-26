import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { useQueryParams } from "@/hooks/useQueryParams";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
// Removed unused generateSecureProtocol

const formSchema = z.object({
    situacao: z.string().min(1, "Selecione a situação"),
    descricao: z.string().optional(),
});

export default function DispenserForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidQr, setIsValidQr] = useState(true);
    const [protocol, setProtocol] = useState<string>("");

    useEffect(() => {
        if (!params.id || !params.localizacao) {
            setIsValidQr(false);
        }
    }, [params]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            situacao: "",
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

            // 2. Salvar no Supabase (chamados_dispenser)
            // @ts-ignore
            const { data: novoChamado, error } = await supabase.from("chamados_dispenser").insert({
                localizacao: params.localizacao,
                tipo_insumo: "Alcool",
                problema: values.situacao,
                observacao: values.descricao, // Added column via migration
                tenant_id: tenantId,
                status: "aberto"
            }).select().single();

            if (error) throw error;

            const protocolNum = (novoChamado as any).protocolo;
            setProtocol(protocolNum);

            // 3. Webhook N8N
            const origin = window.location.origin;
            const linkFinalizar = `${origin}/formularios/dispenser/finalizar?protocolo=${protocolNum}`;
            const gpMessage = `*CHAMADO ABERTO (DISPENSER DE ÁLCOOL)*
Protocolo: ${protocolNum}
Local: ${params.localizacao}
Status: ${values.situacao}
Descrição: ${values.descricao || '-'}

Clique no link para finalizar o chamado:
${linkFinalizar}`;

            const n8nPayload = {
                event_type: "abrir",
                protocol: protocolNum,
                dispenser_localizacao: params.localizacao,
                dispenser_status: values.situacao,
                dispenser_descricao: values.descricao || "",
                gp_message: gpMessage,
                submitted_at: new Date().toISOString(),
                source: "site_dispenser_abrir"
            };

            await fetch("https://n8n.imagoradiologia.cloud/webhook/Dispenser", {
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
            console.error(error);
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
                    <p className="text-muted-foreground">Não foi possível identificar o local.</p>
                </div>
            </SimpleLayout>
        );
    }

    if (isSuccess) {
        return (
            <SimpleLayout title="Solicitação Enviada">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-green-700">Chamado Aberto!</h2>
                        <p className="text-lg font-mono font-bold mt-2 text-primary">{protocol}</p>
                        <p className="text-muted-foreground mt-2">
                            O chamado para <strong>{params.localizacao}</strong> foi registrado.
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
        <SimpleLayout title="Dispenser de Álcool" subtitle={params.localizacao}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm">
                        <p className="font-semibold text-foreground/80">Local Identificado:</p>
                        <p className="text-lg font-bold text-primary">{params.localizacao}</p>
                        {params.marca && <p className="text-muted-foreground">Marca: {params.marca}</p>}
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="situacao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qual a situação do dispenser?</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Selecione o problema..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Faltando insumo">Faltando insumo</SelectItem>
                                                <SelectItem value="Sujo">Sujo</SelectItem>
                                                <SelectItem value="Quebrado">Quebrado</SelectItem>
                                                <SelectItem value="Outro">Outro</SelectItem>
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
                                        <FormLabel>Observações (Opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ex: Vazando muito álcool..."
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
                                className="w-full h-12 text-lg shadow-md hover:translate-y-px transition-all"
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
