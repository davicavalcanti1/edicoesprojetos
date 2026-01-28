
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface LivreFormProps {
    form: UseFormReturn<any>;
}

export function LivreForm({ form }: LivreFormProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Detalhes da Ocorrência
                </h3>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="dadosEspecificos.titulo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título da Ocorrência</FormLabel>
                                <FormControl>
                                    <Input placeholder="Resumo curto do problema..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dadosEspecificos.descricao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição Detalhada</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descreva todos os detalhes do ocorrido..."
                                        className="min-h-[200px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
