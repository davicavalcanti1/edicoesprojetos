
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, AlertTriangle, FileCheck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    tipo_servico: z.string().min(1, "Selecione o tipo de serviço"),
    nome_prestador: z.string().min(3, "Nome do prestador obrigatório"),
    data_manutencao: z.string().min(1, "Data obrigatória"),
    descricao_servico: z.string().min(3, "Descrição obrigatória"),
    custo: z.string().optional(),
    observacoes: z.string().optional(),
});

export default function ServicosTerceirizadosForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidQr, setIsValidQr] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!params.id) {
            setIsValidQr(false);
        }
    }, [params]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo_servico: "",
            nome_prestador: "",
            data_manutencao: today,
            descricao_servico: "",
            custo: "",
            observacoes: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // Este tipo 'servico_terceirizado' não tem webhook configurado em sendQrForm, 
            // então não enviará WhatsApp nem chamará o N8N, apenas salvará no Supabase.
            const payload = {
                tipo: "servico_terceirizado" as const,
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
                    title: "Serviço Registrado!",
                    description: "O registro foi salvo com sucesso.",
                });
            } else {
                throw new Error("Falha no envio");
            }
        } catch (error) {
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
                            Serviço em <strong>{params.localizacao}</strong> foi salvo.
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
        <SimpleLayout title="Serviços Terceirizados" subtitle={params.localizacao}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm">
                        <p className="font-semibold text-foreground/80">Local do Serviço:</p>
                        <p className="text-lg font-bold text-primary">{params.localizacao || "Local não identificado"}</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="tipo_servico"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Serviço *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Desentupidora">Desentupidora</SelectItem>
                                                <SelectItem value="Troca de Vaso/Pia">Troca de Vaso/Pia</SelectItem>
                                                <SelectItem value="Dedetização">Dedetização</SelectItem>
                                                <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                                                <SelectItem value="Elétrica">Elétrica</SelectItem>
                                                <SelectItem value="Refrigeração">Refrigeração</SelectItem>
                                                <SelectItem value="Outro">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="nome_prestador"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa / Técnico *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome do técnico ou empresa" {...field} />
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
                                        <FormLabel>Descrição *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva o serviço realizado..."
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
