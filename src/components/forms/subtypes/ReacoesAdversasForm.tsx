import { UseFormReturn } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";
import { Label } from "@/components/ui/label";

interface ReacoesAdversasFormProps {
    form: UseFormReturn<OccurrenceFormData>;
}

export function ReacoesAdversasForm({ form }: ReacoesAdversasFormProps) {
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-900">Reações Adversas</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            Registre detalhes sobre reações adversas ao meio de contraste ou medicação.
                        </p>
                    </div>
                </div>
            </div>

            {/* Detalhes do Contraste/Medicação */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Detalhes do Contraste/Medicação</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <FormLabel>Qual o contraste utilizado?</FormLabel>
                        <Input
                            placeholder="Ex: Iopamiron 300, Gadolínio..."
                            value={dados.contrasteUtilizado || ""}
                            onChange={(e) => updateDados("contrasteUtilizado", e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Validade e Lote</FormLabel>
                        <Input
                            placeholder="Ex: Val 12/26 Lote 123456"
                            value={dados.validadeLote || ""}
                            onChange={(e) => updateDados("validadeLote", e.target.value)}
                            className="bg-background"
                        />
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Quantidade injetada</FormLabel>
                        <Input
                            placeholder="Ex: 15ml"
                            value={dados.quantidadeInjetada || ""}
                            onChange={(e) => updateDados("quantidadeInjetada", e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>
            </div>

            {/* Avaliação e Conduta */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Avaliação e Conduta</h3>

                <div className="space-y-2">
                    <FormLabel>Médico que avaliou</FormLabel>
                    <Input
                        placeholder="Nome do médico"
                        value={dados.medicoAvaliou || ""}
                        onChange={(e) => updateDados("medicoAvaliou", e.target.value)}
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <FormLabel>Conduta</FormLabel>
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start space-x-3">
                            <input
                                type="radio"
                                id="conduta-adversa-sim"
                                name="conduta-adversa"
                                value="Realizar no mesmo dia acesso em outro membro / Remarcar posteriormente o complemento do contraste"
                                checked={dados.conduta === "Realizar no mesmo dia acesso em outro membro / Remarcar posteriormente o complemento do contraste"}
                                onChange={(e) => updateDados("conduta", e.target.value)}
                                className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="conduta-adversa-sim" className="leading-normal">
                                <span className="font-semibold block mb-1">Sim</span>
                                Realizar no mesmo dia acesso em outro membro / Remarcar posteriormente o complemento do contraste
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3">
                            <input
                                type="radio"
                                id="conduta-adversa-nao"
                                name="conduta-adversa"
                                value="Não foi necessário complementar, exame com possibilidade de liberação"
                                checked={dados.conduta === "Não foi necessário complementar, exame com possibilidade de liberação"}
                                onChange={(e) => updateDados("conduta", e.target.value)}
                                className="mt-1 h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="conduta-adversa-nao" className="leading-normal">
                                <span className="font-semibold block mb-1">Não</span>
                                Não foi necessário complementar, exame com possibilidade de liberação
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* File attachment hint */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Utilize a seção de anexos abaixo para adicionar imagens das reações.
                </p>
            </div>
        </div>
    );
}
