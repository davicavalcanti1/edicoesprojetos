
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertTriangle, Camera, UploadCloud } from "lucide-react";
import { SimpleLayout } from "@/components/layout/SimpleLayout";
import { useQueryParams } from "@/hooks/useQueryParams";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadMaintenancePhotos } from "@/lib/form-utils";

const formSchema = z.object({
    tecnico: z.string().min(3, "Nome obrigatório"),
    data_manutencao: z.string().min(1, "Data obrigatória"),
    tipo_manutencao: z.string().min(1, "Selecione o tipo"),
    descricao: z.string().min(3, "Descrição obrigatória"),
    proxima_manutencao: z.string().optional(),
    custo: z.string().optional(),
    observacoes: z.string().optional(),
});

export default function ArTerceirizadoForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Fotos
    const [fotoAntes, setFotoAntes] = useState<File | null>(null);
    const [fotoDepois, setFotoDepois] = useState<File | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tecnico: "",
            data_manutencao: new Date().toISOString().split('T')[0],
            tipo_manutencao: "",
            descricao: "Manutenção preventiva padrão",
            proxima_manutencao: "",
            custo: "",
            observacoes: ""
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // 0. Tenant
            const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
            const tenantId = tenant?.id;

            // 1. Upload
            const uploads = [];
            if (fotoAntes) uploads.push(fotoAntes);
            if (fotoDepois) uploads.push(fotoDepois);
            const photoUrls = await uploadMaintenancePhotos(uploads);

            // 2. Insert Supabase (chamados_ar_condicionado)
            // @ts-ignore
            const { error: insertError } = await supabase.from("chamados_ar_condicionado").insert({
                localizacao: params.sala || "N/A",
                descricao: `[Terceirizado] ${values.tipo_manutencao}: ${values.descricao}. Tech: ${values.tecnico}`,

                // Fields specific to AC
                modelo: params.modelo,
                numero_serie: params.numero_serie,

                // Status
                status: "concluido",
                prioridade: "media",
                tenant_id: tenantId,

                // Metadata
                solicitante_info: {
                    nome: values.tecnico,
                    tipo: "terceirizado",
                    tipo_manutencao: values.tipo_manutencao,
                    data_manutencao: values.data_manutencao,
                    proxima: values.proxima_manutencao,
                    custo: values.custo,
                    fotos: photoUrls,
                    observacoes: values.observacoes
                }
            });

            if (insertError) throw insertError;

            // 3. Webhook (DISABLED)
            // await fetch("https://n8n.imagoradiologia.cloud/webhook/Tickets", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify(n8nPayload)
            // }).catch(console.error);

            setIsSuccess(true);
            toast({ title: "Sucesso", description: "Manutenção terceirizada salva!" });

        } catch (err) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <SimpleLayout title="Registrado">
                <div className="flex flex-col items-center p-8 text-center space-y-6">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                    <h2 className="text-xl font-bold">Serviço Salvo!</h2>
                    <Button onClick={() => window.location.reload()} variant="outline">Novo Registro</Button>
                </div>
            </SimpleLayout>
        );
    }

    if (!params.numero_serie) {
        return <SimpleLayout title="Erro"><div className="text-center p-8">QR Code sem parâmetros.</div></SimpleLayout>;
    }

    return (
        <SimpleLayout title="Ar Condicionado (Terceirizado)" subtitle={`${params.sala} - ${params.modelo}`}>
            <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="tecnico"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Técnico *</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Foto Antes</FormLabel>
                                    <Input type="file" accept="image/*" onChange={(e) => setFotoAntes(e.target.files?.[0] || null)} />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Foto Depois</FormLabel>
                                    <Input type="file" accept="image/*" onChange={(e) => setFotoDepois(e.target.files?.[0] || null)} />
                                </FormItem>
                            </div>

                            <FormField
                                control={form.control}
                                name="data_manutencao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Manutenção *</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipo_manutencao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="preventiva">Preventiva</SelectItem>
                                                <SelectItem value="corretiva">Corretiva</SelectItem>
                                                <SelectItem value="outro">Outro</SelectItem>
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
                                        <FormLabel>Descrição do Serviço *</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="proxima_manutencao"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Próxima Data (Opcional)</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="custo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Custo R$ (Opcional)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="observacoes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observações / Pendências</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                                {isSubmitting ? "Enviando..." : "Registrar Manutenção"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </SimpleLayout>
    );
}
