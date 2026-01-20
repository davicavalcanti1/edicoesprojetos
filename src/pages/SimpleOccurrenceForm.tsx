
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import { format } from "date-fns";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const simpleOccurrenceSchema = z.object({
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
    hasPatient: z.boolean().default(false),
    patientName: z.string().optional(),
    patientPhone: z.string().optional(),
    patientBirthDate: z.string().optional(),
}).refine((data) => {
    if (data.hasPatient) {
        return !!data.patientName && data.patientName.length > 3;
    }
    return true;
}, {
    message: "Nome do paciente é obrigatório quando selecionado",
    path: ["patientName"],
});

type SimpleOccurrenceFormValues = z.infer<typeof simpleOccurrenceSchema>;

export default function SimpleOccurrenceForm() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SimpleOccurrenceFormValues>({
        resolver: zodResolver(simpleOccurrenceSchema),
        defaultValues: {
            description: "",
            hasPatient: false,
            patientName: "",
            patientPhone: "",
            patientBirthDate: "",
        },
    });

    const hasPatient = form.watch("hasPatient");

    const onSubmit = async (data: SimpleOccurrenceFormValues) => {
        if (!profile?.tenant_id) {
            toast({ title: "Erro", description: "Sessão inválida. Tente recarregar.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Generate protocol
            const { data: protocolo, error: protoError } = await supabase
                .rpc("generate_protocol_number", { p_tenant_id: profile.tenant_id });

            if (protoError) throw protoError;

            const insertData: any = {
                tenant_id: profile.tenant_id,
                protocolo,
                tipo: 'simples', // Using the new type
                status: 'registrada',
                descricao_detalhada: data.description,
                criado_por: profile.id,
            };

            if (data.hasPatient) {
                insertData.paciente_nome_completo = data.patientName;
                insertData.paciente_telefone = data.patientPhone;
                insertData.paciente_data_nascimento = data.patientBirthDate ? format(new Date(data.patientBirthDate), 'yyyy-MM-dd') : null;
            }

            const { error } = await supabase.from('occurrences').insert(insertData);
            if (error) throw error;

            toast({
                title: "Ocorrência registrada!",
                description: `Protocolo: ${protocolo}`,
            });
            navigate("/ocorrencias");

        } catch (error: any) {
            console.error("Error submitting simple occurrence:", error);
            toast({
                title: "Erro ao registrar",
                description: error.message || "Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-2xl animate-fade-in p-4">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/ocorrencias/nova")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Save className="h-5 w-5" />
                            </span>
                            Nova Ocorrência Simplificada
                        </CardTitle>
                        <CardDescription>
                            Registre rapidamente uma ocorrência em texto livre via painel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição da Ocorrência</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva o que aconteceu em detalhes..."
                                                    className="min-h-[150px] resize-y"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="hasPatient"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Envolve um paciente?
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Marque se a ocorrência está relacionada a um paciente específico.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    {hasPatient && (
                                        <div className="grid gap-4 pl-7 animate-in slide-in-from-top-2">
                                            <FormField
                                                control={form.control}
                                                name="patientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nome do Paciente</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input className="pl-9" placeholder="Nome completo" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="patientPhone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Telefone (Opcional)</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="(00) 00000-0000" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="patientBirthDate"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Data de Nascimento (Opcional)</FormLabel>
                                                            <FormControl>
                                                                <Input type="date" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Registrar Ocorrência
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
