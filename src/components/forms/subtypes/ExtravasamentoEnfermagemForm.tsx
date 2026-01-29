import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Droplets, Check, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDoctors, useEmployees } from "@/hooks/useResources";

interface ExtravasamentoEnfermagemFormProps {
    form: UseFormReturn<OccurrenceFormData>;
}

export function ExtravasamentoEnfermagemForm({ form }: ExtravasamentoEnfermagemFormProps) {
    const dados = (form.watch("dadosEspecificos") as any) || {};

    // Hooks for resources
    const { data: doctors = [] } = useDoctors();
    const { data: employees = [] } = useEmployees();

    // States for Popovers
    const [openMedico, setOpenMedico] = useState(false);
    const [openAuxiliar, setOpenAuxiliar] = useState(false);
    const [openTecnico, setOpenTecnico] = useState(false);
    const [openCoordenador, setOpenCoordenador] = useState(false);

    const updateDados = (field: string, value: any) => {
        form.setValue("dadosEspecificos", {
            ...dados,
            [field]: value,
        });
    };

    // Helpers to find names for display (if storing ID, but here we store Name directly usually for simple fields, but let's encourage Name storage for these legacy fields unless we refactor to IDs. The form stores names currently.)
    // Let's store Names to maintain compatibility with existing payload structure unless instructed to change to IDs.
    // The user requirement said: "utilizar as tabelas existentes no banco de dados".

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
                        <Popover open={openMedico} onOpenChange={setOpenMedico}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openMedico}
                                    className="w-full justify-between bg-background"
                                >
                                    {dados.medicoAvaliou || "Selecione o médico..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 z-50">
                                <Command>
                                    <CommandInput placeholder="Buscar médico..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {doctors.map((doctor) => (
                                                <CommandItem
                                                    key={doctor.id}
                                                    value={doctor.nome}
                                                    onSelect={() => {
                                                        updateDados("medicoAvaliou", doctor.nome);
                                                        setOpenMedico(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            dados.medicoAvaliou === doctor.nome ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {doctor.nome}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Responsáveis */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Responsáveis</h3>

                {/* Responsável Auxiliar/Técnico de Enfermagem */}
                <div className="space-y-2">
                    <Label>Responsável Auxiliar/Técnico de Enfermagem</Label>
                    <Input
                        placeholder="Nome do responsável"
                        value={dados.responsavelAuxiliarEnf || ""}
                        onChange={(e) => updateDados("responsavelAuxiliarEnf", e.target.value)}
                    />
                </div>

                {/* Responsável Técnico de Radiologia */}
                <div className="space-y-2">
                    <Label>Técnico de Radiologia Responsável</Label>
                    <Input
                        placeholder="Nome do técnico"
                        value={dados.responsavelTecnicoRadiologia || dados.responsavelTecnicoRaioX || ""}
                        onChange={(e) => updateDados("responsavelTecnicoRadiologia", e.target.value)}
                    />
                </div>

                {/* Coordenador Responsável */}
                <div className="space-y-2">
                    <Label>Coordenador Responsável</Label>
                    <Input
                        placeholder="Nome do coordenador"
                        value={dados.responsavelCoordenador || ""}
                        onChange={(e) => updateDados("responsavelCoordenador", e.target.value)}
                    />
                </div>
            </div>

            {/* File attachment hint */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Utilize a seção de anexos abaixo para adicionar arquivos relacionados (Fotos, Documentos, etc).
                </p>
            </div>
        </div>
    );
}
