
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Define local interface for Admin Occurrence
interface AdministrativeOccurrence {
    id: string;
    protocol: string;
    employee_name: string;
    occurrence_date: string;
    type: string;
    subtype: string;
    description: string;
    status: string;
    created_at: string;
    coordinator_signature_path?: string;
    employee_signature_path?: string;
    signed_at?: string;
}

// ====== COLORS (Imago Branding) ======
const IMAGO_BLUE = [0, 82, 156] as const;           // #00529C
const IMAGO_BLUE_LIGHT = [240, 247, 255] as const;  // Background boxes
const IMAGO_AMBER = [245, 158, 11] as const;        // Amber-500
const IMAGO_AMBER_LIGHT = [255, 251, 235] as const; // Amber-50
const IMAGO_TEXT_DARK = [31, 41, 55] as const;      // Main text
const IMAGO_TEXT_GRAY = [107, 114, 128] as const;   // Labels
const IMAGO_BORDER = [222, 226, 230] as const;      // Outlines

export function generateAdminOccurrencePDF(occurrence: AdministrativeOccurrence, logoBase64?: string): jsPDF {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    let y = 15;

    const setPrimary = () => doc.setTextColor(IMAGO_BLUE[0], IMAGO_BLUE[1], IMAGO_BLUE[2]);
    const setWarning = () => doc.setTextColor(IMAGO_AMBER[0], IMAGO_AMBER[1], IMAGO_AMBER[2]);
    const setDark = () => doc.setTextColor(IMAGO_TEXT_DARK[0], IMAGO_TEXT_DARK[1], IMAGO_TEXT_DARK[2]);
    const setGray = () => doc.setTextColor(IMAGO_TEXT_GRAY[0], IMAGO_TEXT_GRAY[1], IMAGO_TEXT_GRAY[2]);

    const checkBreak = (needed = 20) => {
        if (y > pageHeight - 20 - needed) {
            doc.addPage();
            y = 15;
        }
    };

    // ====== HEADER ======
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, "PNG", marginX, y, 40, 12);
        } catch (e) {
            console.error("Logo error", e);
        }
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        setPrimary();
        doc.text("IMAGO", marginX, y + 8);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setDark();
    doc.text("OCORRÊNCIA ADMINISTRATIVA (RH)", pageWidth - marginX, y + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setGray();
    doc.text(`Protocolo: ${occurrence.protocol || "S/N"}`, pageWidth - marginX, y + 10, { align: "right" });

    y += 25;

    // ====== SUMMARY BOX ======
    doc.setFillColor(IMAGO_AMBER_LIGHT[0], IMAGO_AMBER_LIGHT[1], IMAGO_AMBER_LIGHT[2]);
    doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 20, 2, 2, "FD");

    doc.setFontSize(9);
    setGray();
    doc.text("STATUS", marginX + 5, y + 6);
    doc.text("TIPO", marginX + 60, y + 6);
    doc.text("SUBTIPO", marginX + 120, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setDark();
    doc.text(occurrence.status?.toUpperCase() || "ABERTO", marginX + 5, y + 12);
    doc.text(occurrence.type || "-", marginX + 60, y + 12);
    doc.text(occurrence.subtype || "-", marginX + 120, y + 12);

    y += 30;

    // ====== EMPLOYEE DATA ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setWarning();
    doc.text("DADOS DO COLABORADOR E EVENTO", marginX, y);
    y += 6;
    doc.setDrawColor(IMAGO_AMBER[0], IMAGO_AMBER[1], IMAGO_AMBER[2]);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + 60, y);
    y += 10;

    const gridData = [
        ["Nome do Funcionário", occurrence.employee_name],
        ["Data da Ocorrência", occurrence.occurrence_date ? format(new Date(occurrence.occurrence_date), "dd/MM/yyyy", { locale: ptBR }) : "-"],
        ["Registrado em", format(new Date(occurrence.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })]
    ];

    autoTable(doc, {
        startY: y,
        body: gridData,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: "normal", textColor: IMAGO_TEXT_GRAY as any, cellWidth: 50 },
            1: { fontStyle: "bold", textColor: IMAGO_TEXT_DARK as any, cellWidth: 100 },
        },
        margin: { left: marginX },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // ====== DESCRIPTION ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setGray();
    doc.text("DESCRIÇÃO DA OCORRÊNCIA", marginX, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setDark();
    const descLines = doc.splitTextToSize(occurrence.description || "Sem descrição.", pageWidth - marginX * 2);
    doc.text(descLines, marginX, y);
    y += descLines.length * 5 + 10;

    // ====== SIGNATURES ======
    if (occurrence.coordinator_signature_path || occurrence.employee_signature_path) {
        checkBreak(60);

        doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
        doc.setLineWidth(0.2);
        doc.line(marginX, y, pageWidth - marginX, y); // Separator
        y += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        setDark();
        doc.text("ASSINATURAS DIGITAIS", marginX, y);
        y += 15;

        const signatureWidth = 50;
        const signatureHeight = 25;

        // Coordinator
        if (occurrence.coordinator_signature_path) {
            try {
                // If it's a URL, addImage might work if CORS allows, otherwise needs b64.
                // Assuming public URL works or pre-fetched.
                doc.addImage(occurrence.coordinator_signature_path, 'PNG', marginX + 10, y, signatureWidth, signatureHeight);
            } catch (e) {
                console.error("Sig load error", e);
                doc.setFontSize(8);
                doc.text("[Erro img]", marginX + 10, y + 10);
            }
        }

        // Employee
        if (occurrence.employee_signature_path) {
            try {
                doc.addImage(occurrence.employee_signature_path, 'PNG', pageWidth - marginX - signatureWidth - 10, y, signatureWidth, signatureHeight);
            } catch (e) {
                console.error("Sig load error", e);
                doc.setFontSize(8);
                doc.text("[Erro img]", pageWidth - marginX - signatureWidth - 10, y + 10);
            }
        }

        y += signatureHeight + 5;

        // Labels
        doc.setFontSize(8);
        setGray();
        doc.text("Coordenador", marginX + 10 + (signatureWidth / 2), y, { align: 'center' });
        doc.text("Colaborador", pageWidth - marginX - 10 - (signatureWidth / 2), y, { align: 'center' });

        y += 5;
        if (occurrence.signed_at) {
            doc.setFontSize(7);
            doc.text(`Assinado eletronicamente em: ${format(new Date(occurrence.signed_at), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, y, { align: 'center' });
        }
    }

    // ====== FOOTER ======
    const addFooter = () => {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setDrawColor(IMAGO_BORDER[0], IMAGO_BORDER[1], IMAGO_BORDER[2]);
            doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            setPrimary();
            doc.text("Imago diagnóstico por imagem", marginX, pageHeight - 10);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            setGray();
            doc.text("RH e Gestão de Pessoas", marginX + 50, pageHeight - 10);

            setGray();
            doc.setFont("helvetica", "normal");
            doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 10, { align: "right" });
        }
    };

    addFooter();
    return doc;
}

export function downloadAdminOccurrencePDF(occurrence: AdministrativeOccurrence) {
    const doc = generateAdminOccurrencePDF(occurrence);
    doc.save(`${occurrence.protocol || "ocorrencia"}.pdf`);
}
