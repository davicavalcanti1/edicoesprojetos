import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { useQueryParams } from "@/hooks/useQueryParams";
import { sendQrForm } from "@/lib/qr-webhook";
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

const formSchema = z.object({
    problema: z.string().min(1, "Selecione o problema"),
    descricao: z.string().min(3, "Descreva o que deve ser feito"),
});

export default function BanheiroForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidQr, setIsValidQr] = useState(true);

    // Validate QR params on mount
    useEffect(() => {
        if (!params.id || !params.localizacao) {
            setIsValidQr(false);
        }
    }, [params]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            problema: "",
            descricao: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const payload = {
                tipo: "banheiro" as const,
                id_qrcode: params.id || 0,
                localizacao: params.localizacao || "Local Desconhecido",
                dados_usuario: values,
                timestamp: new Date().toISOString(),
                metadata: { ...params }
            };

            const success = await sendQrForm(payload);

            if (success) {
                setIsSuccess(true);
                toast({
                    title: "Chamado aberto!",
                    description: "Equipe de limpeza notificada.",
                });
            } else {
                throw new Error("Falha no envio");
            }
        } catch (error) {
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
                        <h2 className="text-2xl font-bold text-green-700">Obrigado!</h2>
                        <p className="text-muted-foreground mt-2">
                            Problema em <strong>{params.localizacao}</strong> reportado.
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
        <SimpleLayout title="Banheiro / Pia" subtitle={params.localizacao}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm">
                        <p className="font-semibold text-foreground/80">Local:</p>
                        <p className="text-lg font-bold text-primary">{params.localizacao}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="problema"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qual o problema?</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Falta de insumo">Falta de insumo</SelectItem>
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
                                        <FormLabel>Descrição do que deve ser feito *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ex: Pia entupida, torneira vazando..."
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
                                        Reportar Problema
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
