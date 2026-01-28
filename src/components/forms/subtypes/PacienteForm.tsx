
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface PacienteFormProps {
    form: UseFormReturn<any>;
}

export function PacienteForm({ form }: PacienteFormProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Relato do Paciente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="dadosEspecificos.classificacao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Classificação</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a classificação" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="atendimento">Atendimento</SelectItem>
                                        <SelectItem value="instalacoes">Instalações / Conforto</SelectItem>
                                        <SelectItem value="tempo_espera">Tempo de Espera</SelectItem>
                                        <SelectItem value="administrativo">Administrativo / Agendamento</SelectItem>
                                        <SelectItem value="equipe_medica">Equipe Médica</SelectItem>
                                        <SelectItem value="outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dadosEspecificos.areaEnvolvida"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Área Envolvida</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a área" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="recepcao">Recepção</SelectItem>
                                        <SelectItem value="enfermagem">Enfermagem</SelectItem>
                                        <SelectItem value="medicos">Médicos</SelectItem>
                                        <SelectItem value="limpeza">Limpeza</SelectItem>
                                        <SelectItem value="call_center">Call Center</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="mt-6">
                    <FormField
                        control={form.control}
                        name="dadosEspecificos.relato"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição Detalhada do Relato</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descreva exatamente o que o paciente relatou..."
                                        className="min-h-[150px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="mt-6">
                    <FormField
                        control={form.control}
                        name="dadosEspecificos.email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email para Contato (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="email@exemplo.com" {...field} />
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
