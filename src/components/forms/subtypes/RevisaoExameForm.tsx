import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FileSearch, Paperclip, Check, ChevronsUpDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { OccurrenceFormData } from "@/types/occurrence";
import { AttachmentUpload, PendingFile } from "@/components/attachments/AttachmentUpload";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RevisaoExameFormProps {
  form: UseFormReturn<OccurrenceFormData>;
  pendingFiles?: PendingFile[];
  onFilesChange?: (files: PendingFile[]) => void;
}

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { MEDICOS } from "@/constants/doctors";

// Lista de tipos de exame
const tiposExame = [
  { value: "Ressonância Magnética", label: "Ressonância Magnética" },
  { value: "Tomografia", label: "Tomografia" },
  { value: "Raio-X", label: "Raio-X" },
  { value: "Densitometria", label: "Densitometria" },
  { value: "Mamografia", label: "Mamografia" },
  { value: "Ultrassonografia", label: "Ultrassonografia" },
  { value: "PET-CT", label: "PET-CT" },
  { value: "Angiografia", label: "Angiografia" },
  { value: "Fluoroscopia", label: "Fluoroscopia" },
  { value: "Medicina Nuclear", label: "Medicina Nuclear" },
  { value: "Outro", label: "Outro" },
];

// Lista de regiões anatômicas
const regioesAnatomicas = [
  { value: "Crânio", label: "Crânio" },
  { value: "Face", label: "Face" },
  { value: "Pescoço", label: "Pescoço" },
  { value: "Coluna Cervical", label: "Coluna Cervical" },
  { value: "Coluna Torácica", label: "Coluna Torácica" },
  { value: "Coluna Lombar", label: "Coluna Lombar" },
  { value: "Coluna Sacral", label: "Coluna Sacral" },
  { value: "Tórax", label: "Tórax" },
  { value: "Mamas", label: "Mamas" },
  { value: "Abdome Superior", label: "Abdome Superior" },
  { value: "Abdome Inferior", label: "Abdome Inferior" },
  { value: "Pelve", label: "Pelve" },
  { value: "Ombro Direito", label: "Ombro Direito" },
  { value: "Ombro Esquerdo", label: "Ombro Esquerdo" },
  { value: "Braço Direito", label: "Braço Direito" },
  { value: "Braço Esquerdo", label: "Braço Esquerdo" },
  { value: "Cotovelo Direito", label: "Cotovelo Direito" },
  { value: "Cotovelo Esquerdo", label: "Cotovelo Esquerdo" },
  { value: "Antebraço Direito", label: "Antebraço Direito" },
  { value: "Antebraço Esquerdo", label: "Antebraço Esquerdo" },
  { value: "Punho Direito", label: "Punho Direito" },
  { value: "Punho Esquerdo", label: "Punho Esquerdo" },
  { value: "Mão Direita", label: "Mão Direita" },
  { value: "Mão Esquerda", label: "Mão Esquerda" },
  { value: "Quadril Direito", label: "Quadril Direito" },
  { value: "Quadril Esquerdo", label: "Quadril Esquerdo" },
  { value: "Coxa Direita", label: "Coxa Direita" },
  { value: "Coxa Esquerda", label: "Coxa Esquerda" },
  { value: "Joelho Direito", label: "Joelho Direito" },
  { value: "Joelho Esquerdo", label: "Joelho Esquerdo" },
  { value: "Perna Direita", label: "Perna Direita" },
  { value: "Perna Esquerda", label: "Perna Esquerda" },
  { value: "Tornozelo Direito", label: "Tornozelo Direito" },
  { value: "Tornozelo Esquerdo", label: "Tornozelo Esquerdo" },
  { value: "Pé Direito", label: "Pé Direito" },
  { value: "Pé Esquerdo", label: "Pé Esquerdo" },
  { value: "Corpo Inteiro", label: "Corpo Inteiro" },
  { value: "Outro", label: "Outro" },
];

// Motivos de revisão
const motivosRevisao = [
  { value: "Pedido Médico", label: "Pedido Médico" },
  { value: "Auditoria Interna", label: "Auditoria Interna" },
  { value: "Dúvida do Paciente", label: "Dúvida do Paciente" },
  { value: "Erro Identificado", label: "Erro Identificado" },
  { value: "Complemento de Laudo", label: "Complemento de Laudo" },
  { value: "Outro", label: "Outro" },
];

export function RevisaoExameForm({ form, pendingFiles = [], onFilesChange }: RevisaoExameFormProps) {
  const dados = (form.watch("dadosEspecificos") as any) || {};
  const [openTipoExame, setOpenTipoExame] = useState(false);
  const [openRegiao, setOpenRegiao] = useState(false);
  const [openMedico, setOpenMedico] = useState(false);

  const updateDados = (field: string, value: any) => {
    form.setValue(`dadosEspecificos.${field}` as any, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const selectedTipoExame = tiposExame.find(t => t.value === dados.exameModalidade);
  const selectedRegiao = regioesAnatomicas.find(r => r.value === dados.exameRegiao);
  const selectedMedico = MEDICOS.find(m => m.id === dados.medicoResponsavelId);

  return (
    <div className="space-y-6">
      {/* Resumo do subtipo */}


      {/* Exame Revisado */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Exame Revisado</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tipo de Exame - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Tipo de Exame</FormLabel>
            <Popover open={openTipoExame} onOpenChange={setOpenTipoExame}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openTipoExame}
                  className="w-full justify-between bg-background"
                >
                  {selectedTipoExame?.label || "Selecione o tipo de exame..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar tipo de exame..." />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {tiposExame.map((tipo) => (
                        <CommandItem
                          key={tipo.value}
                          value={tipo.label}
                          onSelect={() => {
                            updateDados("exameModalidade", tipo.value);
                            setOpenTipoExame(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.exameModalidade === tipo.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tipo.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Região Anatômica - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Região Anatômica</FormLabel>
            <Popover open={openRegiao} onOpenChange={setOpenRegiao}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openRegiao}
                  className="w-full justify-between bg-background"
                >
                  {selectedRegiao?.label || "Selecione a região anatômica..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar região anatômica..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma região encontrada.</CommandEmpty>
                    <CommandGroup>
                      {regioesAnatomicas.map((regiao) => (
                        <CommandItem
                          key={regiao.value}
                          value={regiao.label}
                          onSelect={() => {
                            updateDados("exameRegiao", regiao.value);
                            setOpenRegiao(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.exameRegiao === regiao.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {regiao.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <FormLabel>Data do exame</FormLabel>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="DD/MM/YYYY"
              value={dados.exameData ? format(new Date(dados.exameData), "dd/MM/yyyy") : ""}
              onChange={(e) => {
                // Allow manual typing/pasting
                // We try to parse DD/MM/YYYY to YYYY-MM-DD for storage
                const inputValue = e.target.value;
                // Basic validation/formatting logic could go here, 
                // but for now we just try to parse if it looks like a date
                // or just store it if the backend accepts string. 
                // Assuming backend expects YYYY-MM-DD based on previous type="date".

                // If user is typing, we might strictly parse only valid dates
                if (inputValue.length === 10) {
                  const [day, month, year] = inputValue.split('/');
                  if (day && month && year) {
                    const date = new Date(`${year}-${month}-${day}`);
                    if (!isNaN(date.getTime())) {
                      updateDados("exameData", date.toISOString().split('T')[0]);
                      return;
                    }
                  }
                }
                // If clearing
                if (inputValue === '') {
                  updateDados("exameData", null);
                }
              }}
              className="bg-background"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal px-3",
                    !dados.exameData && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dados.exameData ? (
                    format(new Date(dados.exameData), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dados.exameData ? new Date(dados.exameData) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      updateDados("exameData", date.toISOString().split('T')[0]);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Médico Responsável - Combobox com busca */}
          <div className="space-y-2">
            <FormLabel>Médico Responsável pelo Laudo</FormLabel>
            <Popover open={openMedico} onOpenChange={setOpenMedico}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openMedico}
                  className="w-full justify-between bg-background"
                >
                  {selectedMedico?.nome || "Selecione o médico..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Buscar médico..." />
                  <CommandList>
                    <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                    <CommandGroup>
                      {MEDICOS.map((medico) => (
                        <CommandItem
                          key={medico.id}
                          value={medico.nome} // Search by name
                          onSelect={() => {
                            // Force value update
                            updateDados("medicoResponsavelId", medico.id);
                            updateDados("medicoResponsavel", medico.nome);
                            setOpenMedico(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              dados.medicoResponsavelId === medico.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {medico.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Laudo já havia sido entregue? - Botões Sim/Não */}
        <div className="space-y-2">
          <FormLabel>O laudo já havia sido entregue?</FormLabel>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={dados.laudoEntregue === "sim" ? "default" : "outline"}
              className={cn(
                "flex-1",
                dados.laudoEntregue === "sim" && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("laudoEntregue", "sim")}
            >
              Sim
            </Button>
            <Button
              type="button"
              variant={dados.laudoEntregue === "nao" ? "default" : "outline"}
              className={cn(
                "flex-1",
                dados.laudoEntregue === "nao" && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("laudoEntregue", "nao")}
            >
              Não
            </Button>
          </div>
        </div>
      </div>

      {/* Motivo da Revisão - Botões */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Motivo da Revisão</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {motivosRevisao.map((motivo) => (
            <Button
              key={motivo.value}
              type="button"
              variant={dados.motivoRevisao === motivo.value ? "default" : "outline"}
              className={cn(
                "h-auto py-3 px-4 text-sm",
                dados.motivoRevisao === motivo.value && "bg-primary text-primary-foreground"
              )}
              onClick={() => updateDados("motivoRevisao", motivo.value)}
            >
              {motivo.label}
            </Button>
          ))}
        </div>

        {dados.motivoRevisao === "Outro" && (
          <div className="space-y-2 mt-4">
            <FormLabel>Especifique o motivo</FormLabel>
            <Input
              placeholder="Descreva o motivo da revisão..."
              value={dados.motivoRevisaoOutro || ""}
              onChange={(e) => updateDados("motivoRevisaoOutro", e.target.value)}
              className="bg-background"
            />
          </div>
        )}
      </div>

      {/* Discrepância Encontrada */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Discrepância Encontrada <span className="text-destructive">*</span></h3>

        <div className="space-y-2">
          <FormLabel>Tipo de discrepância <span className="text-destructive">*</span></FormLabel>
          <Input
            placeholder="Ex: Achado ausente, Achado diferente, Lado errado, Medida incorreta..."
            value={dados.tipoDiscrepancia || ""}
            onChange={(e) => updateDados("tipoDiscrepancia", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* Ação Tomada */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Ação Tomada/Planejada <span className="text-destructive">*</span></h3>

        <div className="space-y-2">
          <FormLabel>Ações <span className="text-destructive">*</span></FormLabel>
          <Textarea
            placeholder="Ex: Retificar laudo, Laudo complementar, Contatar médico solicitante..."
            value={dados.acaoTomada || ""}
            onChange={(e) => updateDados("acaoTomada", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Pessoas Comunicadas */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Pessoas Comunicadas <span className="text-destructive">*</span></h3>

        <div className="space-y-2">
          <FormLabel>Quem foi informado <span className="text-destructive">*</span></FormLabel>
          <Textarea
            placeholder="Liste as pessoas comunicadas (tipo e nome)..."
            value={dados.pessoasComunicadas || ""}
            onChange={(e) => updateDados("pessoasComunicadas", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Anexos - Somente para Revisão de Exame */}
      {onFilesChange && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Paperclip className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Anexos</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Anexe fotos ou documentos relevantes para esta revisão (imagens do exame, laudos, etc.)
          </p>
          <AttachmentUpload
            files={pendingFiles}
            onChange={onFilesChange}
            maxFiles={10}
          />
        </div>
      )}
    </div>
  );
}
