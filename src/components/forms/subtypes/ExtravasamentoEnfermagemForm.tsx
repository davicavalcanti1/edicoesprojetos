import { UseFormReturn } from "react-hook-form";
import { Droplets } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";
import { Label } from "@/components/ui/label";

interface ExtravasamentoEnfermagemFormProps {
    form: UseFormReturn<OccurrenceFormData>;
}

export function ExtravasamentoEnfermagemForm({ form }: ExtravasamentoEnfermagemFormProps) {
    const dados = (form.watch("dadosEspecificos") as any) || {};

    const updateDados = (field: string, value: any) => {
        form.setValue("dadosEspecificos", {
            ...dados,
            [field]: value,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                    <Droplets className="h-5 w-5 text-sky-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-sky-900">Extravasamento de Contraste</h4>
                        <p className="text-sm text-sky-700 mt-1">
                            Registre os detalhes do extravasamento de contraste (Enfermagem).
                        </p>
                    </div>
                </div>
            </div>

            {/* Detalhes do Evento */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Detalhes do Evento</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Volume Injetado */}
                    <div className="space-y-2">
                        <FormLabel>Quantos Ml foi injetado?</FormLabel>
                        <Input
                            placeholder="Ex: 10ml"
                            value={dados.volumeInjetadoMl || ""}
                            onChange={(e) => updateDados("volumeInjetadoMl", e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    {/* Calibre do Acesso */}
                    <div className="space-y-2">
                        <FormLabel>Qual o calibre do acesso?</FormLabel>
                        <Input
                            placeholder="Ex: 18G, 20G..."
                            value={dados.calibreAcesso || ""}
                            onChange={(e) => updateDados("calibreAcesso", e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Fez Rx? */}
                    <div className="space-y-2">
                        <FormLabel>Fez Rx?</FormLabel>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="rx-sim"
                                    name="fezRx"
                                    value="sim"
                                    checked={dados.fezRx === true}
                                    onChange={() => updateDados("fezRx", true)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="rx-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="rx-nao"
                                    name="fezRx"
                                    value="nao"
                                    checked={dados.fezRx === false}
                                    onChange={() => updateDados("fezRx", false)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="rx-nao">Não</Label>
                            </div>
                        </div>
                    </div>

                    {/* Compressa? */}
                    <div className="space-y-2">
                        <FormLabel>Compressa?</FormLabel>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="compressa-sim"
                                    name="compressa"
                                    value="sim"
                                    checked={dados.compressa === true}
                                    onChange={() => updateDados("compressa", true)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="compressa-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="compressa-nao"
                                    name="compressa"
                                    value="nao"
                                    checked={dados.compressa === false}
                                    onChange={() => updateDados("compressa", false)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="compressa-nao">Não</Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conduta e Avaliação */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Droplets className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Conduta e Avaliação</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <FormLabel>Descrição da Conduta</FormLabel>
                        <Textarea
                            placeholder="Descreva detalhadamente a conduta realizada e a avaliação do paciente..."
                            value={dados.conduta || ""}
                            onChange={(e) => updateDados("conduta", e.target.value)}
                            className="min-h-[150px] bg-background resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Qual médico avaliou?</FormLabel>
                        <Input
                            placeholder="Nome do médico"
                            value={dados.medicoAvaliou || ""}
                            onChange={(e) => updateDados("medicoAvaliou", e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* Responsáveis */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Responsáveis</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <FormLabel>Auxiliar de enfermagem responsável</FormLabel>
                        <Input
                            placeholder="Nome"
                            value={dados.auxiliarEnfermagem || ""}
                            onChange={(e) => updateDados("auxiliarEnfermagem", e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Técnico de radiologia responsável</FormLabel>
                        <Input
                            placeholder="Nome"
                            value={dados.tecnicoRadiologia || ""}
                            onChange={(e) => updateDados("tecnicoRadiologia", e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <FormLabel>Coordenador responsável</FormLabel>
                        <Input
                            placeholder="Nome"
                            value={dados.coordenadorResponsavel || ""}
                            onChange={(e) => updateDados("coordenadorResponsavel", e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* File attachment hint - The actual upload is handled by the main form wrapper */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Utilize a seção de anexos abaixo para adicionar arquivos relacionados (Fotos, Documentos, etc).
                </p>
            </div>
        </div>
    );
}
