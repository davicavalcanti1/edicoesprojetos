
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, User, Users } from "lucide-react";
import { format } from "date-fns";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For simple select if needed, but profiles might be many.
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { EMPLOYEES } from "@/constants/employees";

// Schema
const freeOccurrenceSchema = z.object({
    customType: z.string().min(3, "O tipo deve ter pelo menos 3 caracteres"),
    targetType: z.enum(["patient", "employee"]),
    // Patient Fields
    patientName: z.string().optional(),
    patientPhone: z.string().optional(),
    patientBirthDate: z.string().optional(),
    // Employee Field
    employeeName: z.string().optional(),

    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
}).refine((data) => {
    if (data.targetType === "patient") {
        return !!data.patientName && data.patientName.length > 3;
    }
    if (data.targetType === "employee") {
        return !!data.employeeName;
    }
    return true;
}, {
    message: "Preencha os dados do envolvido (Paciente ou Funcionário)",
    path: ["targetType"], // General error path
});

type FreeOccurrenceFormValues = z.infer<typeof freeOccurrenceSchema>;

export default function FreeOccurrenceForm() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [employees, setEmployees] = useState<{ id: string, full_name: string }[]>([]); // Removed

    const form = useForm<FreeOccurrenceFormValues>({
        resolver: zodResolver(freeOccurrenceSchema),
        defaultValues: {
            customType: "",
            targetType: "patient",
            patientName: "",
            patientPhone: "",
            patientBirthDate: "",
            employeeName: "",
            description: "",
        },
    });

    const targetType = form.watch("targetType");

    // Check if we need to filter EMPLOYEES based on input? For now just use Select/Combobox similar to AdminForm
    // But AdminForm uses Radix UI Command/Popover. Here we are using Select. 
    // Let's stick to Select for simplicity or switch to Command if list is too long.
    // The list is around 100 names, Select might be okay but Command is better for searching.
    // However, the previous code used Select. Let's keep Select for now but iterate over EMPLOYEES.

    const onSubmit = async (data: FreeOccurrenceFormValues) => {
        if (!profile?.tenant_id) {
            toast({ title: "Erro", description: "Sessão inválida.", variant: "destructive" });
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
                tipo: 'livre', // New Type
                custom_type: data.customType,
                status: 'registrada',
                descricao_detalhada: data.description,
                criado_por: profile.id,
            };

            if (data.targetType === "patient") {
                insertData.paciente_nome_completo = data.patientName;
                insertData.paciente_telefone = data.patientPhone;
                insertData.paciente_data_nascimento = data.patientBirthDate ? format(new Date(data.patientBirthDate), 'yyyy-MM-dd') : null;
            } else {
                insertData.employee_name = data.employeeName; // Store selected name
                // We are NOT storing related_employee_id anymore because we are using text list
            }

            const { error } = await supabase.from('occurrences').insert(insertData);
            if (error) throw error;

            toast({
                title: "Ocorrência Livre registrada!",
                description: `Protocolo: ${protocolo}`,
            });
            navigate("/ocorrencias");

        } catch (error: any) {
            console.error("Error submitting free occurrence:", error);
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
                <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate("/ocorrencias")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Users className="h-5 w-5" />
                            </span>
                            Nova Ocorrência Livre
                        </CardTitle>
                        <CardDescription>
                            Registre uma ocorrência com classificação manual.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="customType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo / Categoria (Manual)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Manutenção, Conflito, Quebra de Material..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="targetType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="block mb-2">Envolvido Principal</FormLabel>
                                                <div className="flex items-center space-x-4">
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'patient' ? "default" : "outline"}
                                                        onClick={() => field.onChange('patient')}
                                                        className="w-1/2"
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        Paciente
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={field.value === 'employee' ? "default" : "outline"}
                                                        onClick={() => field.onChange('employee')}
                                                        className="w-1/2"
                                                    >
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Funcionário
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {targetType === 'patient' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <FormField
                                                control={form.control}
                                                name="patientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nome do Paciente</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Nome completo" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="patientPhone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Telefone</FormLabel>
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
                                                            <FormLabel>Nascimento</FormLabel>
                                                            <FormControl>
                                                                <Input type="date" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <FormField
                                                control={form.control}
                                                name="employeeName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Selecione o Funcionário</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {EMPLOYEES.map(emp => (
                                                                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição Detalhada</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva o ocorrido livremente..."
                                                    className="min-h-[150px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Registrar Ocorrência Livre
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
