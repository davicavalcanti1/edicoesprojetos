import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Occurrence,
  statusConfig,
  triageConfig,
  outcomeConfig,
  subtypeLabels,
} from "@/types/occurrence";

interface GeneratePDFOptions {
  occurrence: Occurrence;
  includeHistory?: boolean;
  includeOutcome?: boolean;
  includeCapa?: boolean;
  includeAttachments?: boolean;
  anonymize?: boolean;
  logoBase64?: string;
}

const translations: Record<string, string> = {
  exameModalidade: "Modalidade do Exame",
  exameRegiao: "Região Anatômica",
  exameData: "Data do Exame",
  laudoEntregue: "Laudo Entregue?",
  potencialImpacto: "Potencial de Impacto",
  impactoDescricao: "Descrição do Impacto",
  acaoTomada: "Ações Tomadas",
  medicoResponsavel: "Médico Responsável",
  motivoRevisao: "Motivo da Revisão",
  tipoDiscrepancia: "Tipo de Discrepância",
  pessoasComunicadas: "Pessoas Comunicadas",
  ressonancia_magnetica: "Ressonância Magnética",
  tomografia_computadorizada: "Tomografia Computadorizada",
  raio_x: "Raio-X",
  ultrassonografia: "Ultrassonografia",
  mamografia: "Mamografia",
  densitometria_ossea: "Densitometria Óssea",
  sim: "Sim",
  nao: "Não",
  nenhum: "Nenhum",
};

const translate = (value: string) => {
  if (!value) return value;
  if (translations[value]) return translations[value];
  const normalized = value.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_');
  if (translations[normalized]) return translations[normalized];
  return value;
};

// --- Helper to parse JSON fields ---
const getField = (content: string): Record<string, any> | null => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch { } // Not JSON
  return null;
}

// ====== COLORS (Imago Branding - Precise Match) ======
const IMAGO_BLUE = [48, 85, 126] as const;           // #30557E - Darker Blue from header
const IMAGO_BLUE_LIGHT = [240, 247, 255] as const;  // Header Summary Box BG
const IMAGO_TEXT_DARK = [60, 60, 60] as const;      // Main text
const IMAGO_TEXT_GRAY = [120, 120, 120] as const;   // Labels
const IMAGO_GRAY_BOX = [248, 249, 250] as const;    // Detail blocks BG

// ====== LOGO LOADING ======
let cachedLogoBase64: string | null = null;
export async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const response = await fetch("/images/imago-logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result as string;
        resolve(cachedLogoBase64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading logo:", e);
    return null;
  }
}

export function generateOccurrencePDF({
  occurrence,
  includeOutcome = true,
  includeAttachments = false,
  logoBase64,
}: GeneratePDFOptions): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  let y = 15;

  // Font setup
  const setFontBold = (size = 10, color: readonly [number, number, number] = IMAGO_TEXT_DARK) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const setFontNormal = (size = 10, color: readonly [number, number, number] = IMAGO_TEXT_DARK) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const setLabelStyle = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  }

  const checkBreak = (needed = 20) => {
    if (y > pageHeight - 20 - needed) {
      doc.addPage();
      y = 15;
    }
  };

  // Helper to draw gray detail box
  const drawDetailBox = (x: number, yPos: number, w: number, label: string, value: string) => {
    // Box Background
    doc.setFillColor(IMAGO_GRAY_BOX[0], IMAGO_GRAY_BOX[1], IMAGO_GRAY_BOX[2]);
    // No border for these boxes based on image
    doc.roundedRect(x, yPos, w, 14, 1, 1, "F");

    // Label (Small, Gray, Uppercase)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(label.toUpperCase(), x + 2, yPos + 4);

    // Value (Normal, Dark)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    // Handle multiline value if needed
    const splitVal = doc.splitTextToSize(value, w - 4);
    doc.text(splitVal, x + 2, yPos + 9);

    return 14; // Fixed height for standard grid, or dynamic if needed? Image shows fixed/uniform.
  };

  // ====== HEADER ======
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", marginX, y, 45, 13);
    } catch (e) {
      console.error("Logo error", e);
    }
  } else {
    setFontBold(20, IMAGO_BLUE);
    doc.text("IMAGO", marginX, y + 10);
  }

  // Right Side Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("RELATÓRIO DE OCORRÊNCIA", pageWidth - marginX, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Protocolo: ${occurrence.protocolo}`, pageWidth - marginX, y + 10, { align: "right" });

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - marginX, y + 15, { align: "right" });

  y += 25;

  // ====== SUMMARY BOX WITH QR ======
  const boxHeight = 22;
  const boxWidth = pageWidth - marginX * 2;

  doc.setFillColor(IMAGO_BLUE_LIGHT[0], IMAGO_BLUE_LIGHT[1], IMAGO_BLUE_LIGHT[2]);
  // Use a very light blue border or none
  doc.setDrawColor(230, 240, 250);
  doc.roundedRect(marginX, y, boxWidth, boxHeight, 2, 2, "FD");

  // QR Code Generation
  const qrSize = 18;
  const qrPadding = 2;

  // Use public token for the link if available
  const publicToken = occurrence.publicToken || occurrence.id; // Fallback to ID if token missing (internal use)
  const appUrl = window.location.origin;
  // If we have a public token, use the public route, otherwise regular route
  const linkPath = occurrence.publicToken ? `/public/imagens/${publicToken}` : `/ocorrencias/${occurrence.id}`;
  const qrData = `${appUrl}${linkPath}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  // Draw QR on the Right inside the box
  const qrX = pageWidth - marginX - qrSize - qrPadding;
  const qrY = y + (boxHeight - qrSize) / 2;
  doc.addImage(qrUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Summary Fields (Grid 2x2 inside left part)
  const col1X = marginX + 5;
  const col2X = marginX + 95; // Increased spacing (was 75) to prevent overlap from long Type names
  const row1Y = y + 6;
  const row2Y = y + 14;

  // Helper to draw summary label/value pair
  const drawSummaryField = (x: number, yPos: number, label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(70, 130, 180); // Blueish Label
    doc.text(label.toUpperCase() + ":", x, yPos);

    const labelWidth = doc.getTextWidth(label.toUpperCase() + ":");

    // Ensure value doesn't bleed into next column or off screen
    // Max width calculation
    let maxValWidth = 60; // Default max width
    if (x === col1X) maxValWidth = col2X - col1X - labelWidth - 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);

    const valText = value || "—";
    doc.text(valText, x + labelWidth + 2, yPos, { maxWidth: maxValWidth });
  };

  // Robust Type Label Logic
  let typeLabel = occurrence.tipo || "—";
  if (occurrence.tipo === 'revisao_exame') typeLabel = 'Revisão de Exame';
  else if (occurrence.tipo === 'enfermagem') typeLabel = 'Enfermagem';
  else if (occurrence.tipo === 'administrativa') typeLabel = 'Administrativa';

  // Use "TIPO" as label and typeLabel as value
  drawSummaryField(col1X, row1Y, "TIPO", typeLabel);

  const statusLabel = statusConfig[occurrence.status]?.label || occurrence.status || "—";
  drawSummaryField(col1X, row2Y, "STATUS", statusLabel);

  const subtypeLabel = subtypeLabels[occurrence.subtipo] || (occurrence as any).subtype || occurrence.subtipo || "—";
  drawSummaryField(col2X, row1Y, "SUBTIPO", subtypeLabel);

  const triageLabel = occurrence.triagem ? triageConfig[occurrence.triagem]?.label : "Não classificado";
  drawSummaryField(col2X, row2Y, "TRIAGEM", triageLabel);

  y += boxHeight + 10;

  // ====== DADOS DO PACIENTE ======
  // Icon placeholder (simple circle + user shape or text) -> Using text with icon char if possible or just styled text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  // Using a simple workaround for icon: text
  doc.text("Dados do Paciente", marginX, y);
  // Draw a small user icon shape if possible? 
  // Let's keep it simple text as requested unless I have the asset. 
  // User said "importe elementos...", I don't have them locally as files I can read.
  // I will assume the text is sufficient to match style.

  y += 8;

  // Patient Grid (Clean, no lines)
  const p = occurrence.paciente;
  const pNome = p.nomeCompleto || (occurrence as any).paciente_nome_completo || "—";
  const pId = p.cpf || (occurrence as any).paciente_id || "—"; // Image says ID, typically Prontuario or CPF
  const pUnidade = p.unidadeLocal || (occurrence as any).paciente_unidade_local || "—";
  const pDataHora = p.dataHoraEvento || (occurrence as any).paciente_data_hora_evento;
  const pTelefone = p.telefone || (occurrence as any).paciente_telefone || "—";

  // Row 1
  const col1 = marginX;
  const col2 = marginX + 60; // Shifted right
  const col3 = marginX + 120; // Shifted right

  // Field helper for Patient section (Label small gray, Value dark bold)
  const drawPatientField = (x: number, yPos: number, label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(label, x, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(value, x, yPos + 4);
  };

  drawPatientField(col1, y, "Nome", pNome);
  drawPatientField(col2, y, "ID", pId);
  drawPatientField(col3, y, "Telefone", pTelefone);

  y += 10;

  drawPatientField(col1, y, "Unidade", pUnidade);
  const dataHoraStr = pDataHora ? format(new Date(pDataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";
  drawPatientField(col2, y, "Data/Hora do Evento", dataHoraStr);

  y += 15;

  // ====== DETALHES DA OCORRÊNCIA ======
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
  doc.text("Detalhes da Ocorrência", marginX, y);

  y += 8;

  // Descrição Detalhada Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Descrição Detalhada", marginX, y);
  y += 4;

  // We need to parse specific data based on subtype or just raw JSON
  // The image shows specific "Revisão de Exame" fields.
  // I will try to extract them if existing.
  const details = (occurrence.dadosEspecificos || getField(occurrence.descricaoDetalhada)) as any;

  // Helper to safely get value from details object checking multiple casing and variations
  const getValue = (source: any, keys: string[]): any => {
    if (!source) return undefined;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null) return source[key];
    }
    return undefined;
  };

  // Grid System for Boxes (2 columns)
  const boxW = (pageWidth - marginX * 2 - 10) / 2; // 10mm gap
  const leftX = marginX;
  const rightX = marginX + boxW + 10;

  // Draw Boxes
  let currentY = y;

  // Use robust extraction
  // Keys to check for each field
  const modalidade = getValue(details, ["exameModalidade", "exame_modalidade", "modalidade", "exame"]);
  const dataExame = getValue(details, ["exameData", "exame_data", "data_exame", "data"]);
  const regiao = getValue(details, ["exameRegiao", "exame_regiao", "regiao_anatomica", "regiao"]);
  // Laudo entregue might be boolean or string
  let laudoEntregue = getValue(details, ["laudoEntregue", "laudo_entregue", "entregue"]);
  if (typeof laudoEntregue === 'boolean') laudoEntregue = laudoEntregue ? "Sim" : "Não";

  const motivo = getValue(details, ["motivoRevisao", "motivo_revisao", "motivo"]);
  const discrepancia = getValue(details, ["tipoDiscrepancia", "tipo_discrepancia", "discrepancia"]);
  const acao = getValue(details, ["acaoTomada", "acao_tomada", "acao"]);
  const comunicadas = getValue(details, ["pessoasComunicadas", "pessoas_comunicadas", "comunicados"]);

  // Only render grid if we have at least some data
  if (modalidade || dataExame || regiao || motivo || discrepancia) {
    // Row 1
    if (modalidade) drawDetailBox(leftX, currentY, boxW, "Modalidade do exame", translate(String(modalidade)));
    if (dataExame) {
      // Try formatted date
      let dVal = String(dataExame);
      try {
        if (dVal.includes('-')) dVal = format(new Date(dVal), "dd/MM/yyyy");
      } catch { }
      drawDetailBox(rightX, currentY, boxW, "Data do exame", dVal);
    }
    if (modalidade || dataExame) currentY += 16;

    // Row 2
    if (regiao) drawDetailBox(leftX, currentY, boxW, "Região Anatômica", translate(String(regiao)));
    if (laudoEntregue) drawDetailBox(rightX, currentY, boxW, "Laudo Entregue", translate(String(laudoEntregue)));
    if (regiao || laudoEntregue) currentY += 16;

    // Row 3
    if (motivo) drawDetailBox(leftX, currentY, boxW, "Motivo da Revisão", translate(String(motivo)));
    if (discrepancia) {
      const discVal = Array.isArray(discrepancia) ? discrepancia.join(", ") : String(discrepancia);
      drawDetailBox(rightX, currentY, boxW, "Tipo Discrepancia", translate(discVal));
    }
    if (motivo || discrepancia) currentY += 16;

    // Row 4
    if (acao) {
      const acaoVal = Array.isArray(acao) ? acao.join(", ") : String(acao);
      drawDetailBox(leftX, currentY, boxW, "Acao Tomada", translate(acaoVal));
    }
    if (comunicadas) {
      let commsVal = "";
      if (Array.isArray(comunicadas)) {
        commsVal = comunicadas.map((c: any) => c.nome || c).join(", ");
      } else {
        commsVal = String(comunicadas);
      }
      drawDetailBox(rightX, currentY, boxW, "Pessoas Comunicadas", commsVal);
    }
    if (acao || comunicadas) currentY += 16;

  } else {
    // Fallback text description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const descText = occurrence.descricaoDetalhada || "—";
    const lines = doc.splitTextToSize(descText, pageWidth - marginX * 2);
    doc.text(lines, marginX, currentY);
    currentY += (lines.length * 5) + 10;
  }

  const medico = occurrence.medicoDestino || (occurrence as any).medico_destino;
  if (medico) {
    checkBreak(20);
    currentY += 4;
    drawDetailBox(leftX, currentY, pageWidth - marginX * 2, "Médico responsável", medico);
    currentY += 18;
  }

  // ====== ATTACHMENTS (Images) ======
  // Only if includeAttachments is true and we have an image
  if (includeAttachments && (occurrence as any).firstImageBase64) {
    checkBreak(100); // Check if we have space for image

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
    doc.text("Evidência Anexada", marginX, currentY);
    currentY += 8;

    try {
      const imgData = (occurrence as any).firstImageBase64;
      const imgProps = doc.getImageProperties(imgData);
      const pdfW = pageWidth - marginX * 2;
      const pdfH = (imgProps.height * pdfW) / imgProps.width;

      // Helper check break specifically for image size
      if (currentY + pdfH > pageHeight - 15) {
        doc.addPage();
        currentY = 15;
      }

      doc.addImage(imgData, "JPEG", marginX, currentY, pdfW, pdfH);
      currentY += pdfH + 10;
    } catch (err) {
      console.error("Error adding image to PDF", err);
    }
  }

  // ====== FOOTER ======
  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`IMAGO Diagnóstico por Imagem | ${occurrence.protocolo}`, marginX, pageHeight - 10);

      doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 10, { align: "right" });
    }
  };

  addFooter();
  return doc;
}

export function downloadOccurrencePDF(occurrence: Occurrence) {
  const doc = generateOccurrencePDF({ occurrence });
  doc.save(`${occurrence.protocolo}.pdf`);
}
