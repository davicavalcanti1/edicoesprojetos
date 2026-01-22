
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, CheckCircle2, AlertTriangle, FileCheck } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { useQueryParams } from "@/hooks/useQueryParams";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
    nome_prestador: z.string().min(3, "Nome do prestador obrigatório"),
    data_manutencao: z.string().min(1, "Data obrigatória"),
    descricao_servico: z.string().min(3, "Descrição obrigatória"),
    custo: z.string().optional(),
    observacoes: z.string().optional(),
});

export default function BanheiroRaloForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidQr, setIsValidQr] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!params.id || !params.localizacao) {
            setIsValidQr(false);
        }
    }, [params]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome_prestador: "",
            data_manutencao: today,
            descricao_servico: "Limpeza de ralo e sifão",
            custo: "",
            observacoes: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // 1. Salvar no Supabase (maintenance_records)
            const { error } = await supabase.from("maintenance_records").insert({
                tipo_origem: "banheiro_ralo",
                subtipo: "terceirizado",
                localizacao: params.localizacao || "Local Desconhecido",
                responsavel: values.nome_prestador,
                data_manutencao: values.data_manutencao,
                descricao: values.descricao_servico,
                custo: values.custo ? parseFloat(values.custo.replace(',', '.')) : null,
                observacoes: values.observacoes
            });

            if (error) throw error;

            // 2. Webhook N8N (formato flat solicitado)
            const n8nPayload = {
                event_type: "registrar_servico",
                tipo: "limpeza_ralo",
                localizacao: params.localizacao,
                nome_encanador: values.nome_prestador,
                dia_manutencao: values.data_manutencao,
                descricao: values.descricao_servico,
                custo: values.custo,
                observacoes: values.observacoes,
                submitted_at: new Date().toISOString(),
                source: "site_banheiro_limpeza_ralo"
            };

            await fetch("https://n8n.imagoradiologia.cloud/webhook/banheiro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(n8nPayload)
            }).catch(console.error);

            setIsSuccess(true);
            toast({
                title: "Serviço Registrado!",
                description: "O registro de limpeza foi salvo com sucesso.",
            });

        } catch (error) {
            console.error(error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar o registro. Tente novamente.",
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
            <SimpleLayout title="Serviço Salvo">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                        <FileCheck className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-green-700">Registrado!</h2>
                        <p className="text-muted-foreground mt-2">
                            A execução do serviço em <strong>{params.localizacao}</strong> foi salva.
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
        <SimpleLayout title="Registro de Limpeza de Ralo" subtitle={params.localizacao}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm">
                        <p className="font-semibold text-foreground/80">Local do Serviço:</p>
                        <p className="text-lg font-bold text-primary">{params.localizacao}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="nome_prestador"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Encanador/Empresa *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do técnico/empresa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="data_manutencao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="custo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custo (R$)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0,00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="descricao_servico"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição da Manutenção *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva o que foi realizado..."
                                                className="resize-none"
                                                {...field}
                                            />
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
                                        <FormLabel>Observações (Opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Alguma anotação extra?"
                                                className="resize-none h-20"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg shadow-md hover:translate-y-px transition-all bg-emerald-600 hover:bg-emerald-700"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Registrar Serviço
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
