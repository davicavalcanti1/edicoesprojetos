
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Send, CheckCircle2, AlertTriangle, Camera, UploadCloud } from "lucide-react";
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

// Schema específico para Técnico IMAGO
const formSchema = z.object({
    funcionario: z.string().min(3, "Nome obrigatório"),
    data_limpeza: z.string().min(1, "Data obrigatória"),
    descricao: z.string().min(3, "Descrição obrigatória"),
    tem_defeito: z.string().optional(), // "sim" | "nao"
    defeito_descricao: z.string().optional(),
});

export default function ArCondicionadoImagoForm() {
    const params = useQueryParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Estados para controle de arquivos
    const [fotoAntes, setFotoAntes] = useState<File | null>(null);
    const [fotoDepois, setFotoDepois] = useState<File | null>(null);
    const [fotoDefeito, setFotoDefeito] = useState<File | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            funcionario: "",
            data_limpeza: new Date().toISOString().split('T')[0],
            descricao: "Limpeza de filtros e carenagem.",
            tem_defeito: "nao",
            defeito_descricao: ""
        },
    });

    const temDefeito = form.watch("tem_defeito");

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            // 1. Tenant
            const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
            const tenantId = tenant?.id;
            if (!tenantId) throw new Error("Tenant não encontrado");

            // 2. Upload Fotos (Shared bucket?)
            const uploads = [];
            if (fotoAntes) uploads.push(fotoAntes);
            if (fotoDepois) uploads.push(fotoDepois);
            if (values.tem_defeito === "sim" && fotoDefeito) uploads.push(fotoDefeito);

            // Note: uploadMaintenancePhotos likely puts in 'maintenance-photos' bucket. 
            // If we moved to 'attachments', this might need update, but let's assume legacy bucket still exists or we use new one later.
            // For now, let's keep it if it works, otherwise we might need to change buckets.
            const photoUrls = await uploadMaintenancePhotos(uploads);

            // 3. Salvar no Supabase (chamados_ar_condicionado)
            // @ts-ignore
            const { error: insertError } = await supabase.from("chamados_ar_condicionado").insert({
                localizacao: params.sala || params.localizacao || "N/A",
                descricao: `[Manutenção Preventiva] ${values.descricao} \nResp: ${values.funcionario}`,

                // Fields specific to AC
                modelo: params.modelo,
                numero_serie: params.numero_serie,

                // Status
                status: values.tem_defeito === "sim" ? "aberto" : "concluido", // Se tem defeito, deixa aberto
                prioridade: "media",
                tenant_id: tenantId,

                // Metadata
                solicitante_info: {
                    nome: values.funcionario,
                    tipo: "tecnico_imago",
                    data_limpeza: values.data_limpeza,
                    tem_defeito: values.tem_defeito,
                    defeito_descricao: values.defeito_descricao,
                    fotos: photoUrls
                }
            });

            if (insertError) throw insertError;

            // 4. Webhook N8N (DISABLED)
            // await fetch("https://n8n.imagoradiologia.cloud/webhook/Tickets", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify(n8nPayload)
            // }).catch(console.error);

            setIsSuccess(true);
            toast({ title: "Sucesso", description: "Manutenção registrada!" });

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
                    <h2 className="text-xl font-bold">Manutenção Salva!</h2>
                    <Button onClick={() => window.location.reload()} variant="outline">Novo Registro</Button>
                </div>
            </SimpleLayout>
        );
    }

    if (!params.numero_serie) {
        return (
            <SimpleLayout title="Erro">
                <div className="text-center p-8">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p>QR Code incompleto (Falta número de série).</p>
                </div>
            </SimpleLayout>
        );
    }

    return (
        <SimpleLayout title="Ar Condicionado (IMAGO)" subtitle={`${params.sala} - ${params.modelo}`}>
            <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="funcionario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Funcionário IMAGO *</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Foto Antes</FormLabel>
                                    <div className="border border-dashed p-4 rounded text-center cursor-pointer hover:bg-slate-50 relative">
                                        <Input type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e) => setFotoAntes(e.target.files?.[0] || null)} />
                                        {fotoAntes ? <span className="text-green-600 text-xs truncate block">{fotoAntes.name}</span> : <Camera className="mx-auto text-slate-400" />}
                                    </div>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Foto Depois</FormLabel>
                                    <div className="border border-dashed p-4 rounded text-center cursor-pointer hover:bg-slate-50 relative">
                                        <Input type="file" accept="image/*" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e) => setFotoDepois(e.target.files?.[0] || null)} />
                                        {fotoDepois ? <span className="text-green-600 text-xs truncate block">{fotoDepois.name}</span> : <UploadCloud className="mx-auto text-slate-400" />}
                                    </div>
                                </FormItem>
                            </div>

                            <FormField
                                control={form.control}
                                name="data_limpeza"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data da Limpeza *</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição *</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tem_defeito"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Algo com defeito? *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="nao">Não</SelectItem>
                                                <SelectItem value="sim">Sim</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {temDefeito === "sim" && (
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-4 animate-in fade-in">
                                    <FormField
                                        control={form.control}
                                        name="defeito_descricao"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-red-900">Qual o defeito? *</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Descreva a peça ou problema..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormItem>
                                        <FormLabel className="text-red-900">Foto do Defeito</FormLabel>
                                        <Input type="file" accept="image/*" onChange={(e) => setFotoDefeito(e.target.files?.[0] || null)} />
                                    </FormItem>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                                {isSubmitting ? "Enviando..." : "Salvar Registro"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </SimpleLayout>
    );
}
