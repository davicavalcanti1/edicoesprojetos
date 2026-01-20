
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CalendarIcon, Upload, Loader2, Save, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { ADMIN_OCCURRENCE_TYPES } from "@/lib/admin-occurrence-types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadAdminOccurrencePDF } from "@/lib/pdf/admin-occurrence-pdf";

import { EMPLOYEES } from "@/constants/employees";

const formSchema = z.object({
    employeeName: z.string().min(3, "Nome do funcionário é obrigatório"),
    date: z.date({ required_error: "Data da ocorrência é obrigatória" }),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

export default function AdminOccurrenceForm() {
    const navigate = useNavigate();
    const { typeId, subtypeId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [open, setOpen] = useState(false);

    // Validate Type and Subtype
    const selectedType = ADMIN_OCCURRENCE_TYPES.find((t) => t.id === typeId);
    const selectedSubtype = selectedType?.subtypes.find((s) => s.id === subtypeId);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeName: "",
            description: "",
            date: new Date(),
        },
    });

    if (!selectedType || !selectedSubtype) {
        return (
            <MainLayout>
                <div className="text-center py-12">
                    <p>Ocorrência não encontrada.</p>
                    <Button onClick={() => navigate("/ocorrencias/nova/administrativa")}>Voltar</Button>
                </div>
            </MainLayout>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            // 1. Upload files
            const attachments = [];
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${crypto.randomUUID()}.${fileExt}`;
                const filePath = `admin-occurrences/${fileName}`;

                // Ensure bucket exists or handle error silently? 
                // We assume 'attachments' bucket is public/standard.
                const { error: uploadError } = await supabase.storage
                    .from('occurrence-attachments')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('occurrence-attachments')
                    .getPublicUrl(filePath);

                attachments.push({
                    name: file.name,
                    url: publicUrl,
                    type: file.type
                });
            }

            // 2. Insert into administrative_occurrences
            // Casting to any to avoid type errors since Types aren't updated yet with new table
            const { data, error } = await supabase
                .from('administrative_occurrences' as any)
                .insert({
                    tenant_id: (await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()).data?.tenant_id,
                    employee_name: values.employeeName,
                    occurrence_date: format(values.date, 'yyyy-MM-dd'),
                    type: selectedType.label,
                    subtype: selectedSubtype.label,
                    description: values.description,
                    created_by: user.id,
                    attachments: attachments,
                } as any)
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Ocorrência registrada",
                description: `Protocolo: ${(data as any).protocol}`,
            });

            // Generate PDF
            try {
                downloadAdminOccurrencePDF(data as any);
            } catch (pdfError) {
                console.error("PDF generation failed:", pdfError);
                toast({
                    title: "Aviso",
                    description: "Ocorrência salva, mas erro ao gerar PDF.",
                    variant: "destructive"
                });
            }

            navigate(`/ocorrencias/admin/${(data as any).id}`);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Erro ao registrar",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="mx-auto max-w-2xl animate-fade-in pb-10">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/ocorrencias/nova/administrativa/${typeId}`)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <div className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-100">
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <selectedType.icon className="h-5 w-5 text-amber-600" />
                        {selectedType.label}
                    </h1>
                    <p className="text-amber-700 font-medium mt-1 ml-7">
                        {selectedSubtype.label}
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <FormField
                            control={form.control}
                            name="employeeName"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Nome do Funcionário</FormLabel>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? EMPLOYEES.find((employee) => employee === field.value)
                                                        : "Selecione o funcionário"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar funcionário..." />
                                                <CommandList>
                                                    <CommandEmpty>Funcionário não encontrado.</CommandEmpty>
                                                    <CommandGroup>
                                                        {EMPLOYEES.map((employee) => (
                                                            <CommandItem
                                                                value={employee}
                                                                key={employee}
                                                                onSelect={() => {
                                                                    form.setValue("employeeName", employee);
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        employee === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {employee}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data da Ocorrência</FormLabel>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "flex-1 pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione a data</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                    locale={ptBR}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => field.onChange(new Date())}
                                        >
                                            Hoje
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição Detalhada</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva o ocorrido com detalhes..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Attachments */}
                        <div className="space-y-3">
                            <FormLabel>Anexos (Fotos, Áudios ou Vídeos)</FormLabel>
                            <div className="border-2 border-dashed border-input hover:border-amber-400 rounded-lg p-6 text-center transition-colors">
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*,audio/*,.pdf"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Clique para selecionar arquivos
                                    </span>
                                </label>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="text-sm text-foreground bg-secondary/50 p-2 rounded flex justify-between">
                                            <span>{file.name}</span>
                                            <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Registrar Ocorrência Administrativa
                                    </>
                                )}
                            </Button>
                        </div>

                    </form>
                </Form>
            </div>
        </MainLayout>
    );
}
