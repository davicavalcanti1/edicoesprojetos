import { cn } from "@/lib/utils";

interface FormattedDetailsProps {
  content: string;
  className?: string;
}

const translations: Record<string, string> = {
  // Field Labels
  etapaPercebida: "Etapa Percebida",
  comoDetectado: "Como foi Detectado",
  divergencia: "Tipo de Divergência",
  exameStatus: "Status do Exame",
  impactoImediato: "Impacto Imediato",
  medidasCorrecao: "Medidas de Correção",
  fatoresContribuintes: "Fatores Contribuintes",
  localExtravasamento: "Local do Extravasamento",
  volumeExtravasado: "Volume Extravasado",
  sintomasObservados: "Sintomas Observados",
  condutas: "Condutas Tomadas",
  tipoQueda: "Tipo de Queda",
  localQueda: "Local da Queda",
  consequencias: "Consequências",
  motivoRevisao: "Motivo da Revisão",
  tipoAlteracao: "Tipo de Alteração",
  acaoCorretiva: "Ação Corretiva",
  exameModalidade: "Modalidade do Exame",
  exameRegiao: "Região Anatômica",
  exameData: "Data do Exame",
  acaoTomada: "Ações Tomadas",
  medicoResponsavel: "Médico Responsável",
  tipoDiscrepancia: "Tipo de Discrepância",
  pessoasComunicadas: "Pessoas Comunicadas",
  laudoEntregue: "Laudo Entregue?",
  potencialImpacto: "Potencial de Impacto",
  impactoDescricao: "Descrição do Impacto",

  // Values
  ressonancia_magnetica: "Ressonância Magnética",
  tomografia_computadorizada: "Tomografia Computadorizada",
  raio_x: "Raio-X",
  ultrassonografia: "Ultrassonografia",
  mamografia: "Mamografia",
  densitometria_ossea: "Densitometria Óssea",
  pedido_medico: "Pedido Médico",
  auditoria: "Auditoria",
  duvida: "Dúvida",
  segunda_leitura: "Segunda Leitura",
  reclamacao: "Reclamação",
  outro: "Outro",
  sim: "Sim",
  nao: "Não",
  nenhum: "Nenhum",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

const translate = (value: string) => {
  if (!value) return value;
  // Try direct translation
  if (translations[value]) return translations[value];

  // Try normalized translation (lowercase, no special chars)
  const normalized = value.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_');

  if (translations[normalized]) return translations[normalized];

  return value;
};

export function FormattedDetails({ content, className }: FormattedDetailsProps) {
  // Tenta parsear como JSON
  try {
    const parsed = JSON.parse(content);

    if (typeof parsed === "object" && parsed !== null) {
      const entries = Object.entries(parsed).filter(([key, value]) => {
        if (key === "medicoResponsavel" || key === "medicoResponsavelId") return false;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== "";
      });

      if (entries.length === 0) {
        return <p className={cn("text-foreground", className)}>{content}</p>;
      }

      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {translate(key)}
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed break-words break-all whitespace-pre-wrap">
                {Array.isArray(value)
                  ? value.map(v => translate(String(v))).join(", ")
                  : translate(String(value))}
              </p>
            </div>
          ))}
        </div>
      );
    }
  } catch {
    // Não é JSON, retorna texto normal
  }

  return <p className={cn("text-foreground whitespace-pre-wrap leading-relaxed", className)}>{content}</p>;
}
