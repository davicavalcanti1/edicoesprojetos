import { supabase } from "@/integrations/supabase/client";
import { generateOccurrencePDF, loadLogoBase64 } from "./occurrence-pdf";
import { Occurrence } from "@/types/occurrence";
import { DbOccurrence } from "@/hooks/useOccurrences";

// Transform DB occurrence to PDF format (partial for PDF generation)
function transformToPdfFormat(dbOcc: DbOccurrence): Partial<Occurrence> & { id: string; protocolo: string; tipo: any; subtipo: any; descricaoDetalhada: string; status: any } {
  return {
    id: dbOcc.id,
    protocolo: dbOcc.protocolo,
    tenantId: dbOcc.tenant_id,
    criadoPor: dbOcc.criado_por,
    criadoEm: dbOcc.criado_em,
    atualizadoEm: dbOcc.atualizado_em,
    status: dbOcc.status as any,
    triagem: dbOcc.triagem as any,
    triagemPor: dbOcc.triagem_por || undefined,
    triagemEm: dbOcc.triagem_em || undefined,
    tipo: dbOcc.tipo as any,
    subtipo: dbOcc.subtipo as any,
    descricaoDetalhada: dbOcc.descricao_detalhada,
    acaoImediata: dbOcc.acao_imediata || "",
    impactoPercebido: dbOcc.impacto_percebido || "",
    pessoasEnvolvidas: dbOcc.pessoas_envolvidas || undefined,
    contemDadoSensivel: dbOcc.contem_dado_sensivel || false,
    dadosEspecificos: dbOcc.dados_especificos,
    paciente: {
      nomeCompleto: dbOcc.paciente_nome_completo || "",
      telefone: dbOcc.paciente_telefone || "",
      idPaciente: dbOcc.paciente_id || "",
      dataNascimento: dbOcc.paciente_data_nascimento || "",
      tipoExame: dbOcc.paciente_tipo_exame || "",
      unidadeLocal: dbOcc.paciente_unidade_local || "",
      dataHoraEvento: dbOcc.paciente_data_hora_evento || "",
    },
    desfecho: dbOcc.desfecho_tipos?.length
      ? {
        tipos: dbOcc.desfecho_tipos as any,
        justificativa: dbOcc.desfecho_justificativa || "",
        desfechoPrincipal: dbOcc.desfecho_principal as any,
        definidoPor: dbOcc.desfecho_definido_por || "",
        definidoEm: dbOcc.desfecho_definido_em || "",
      }
      : undefined,
  };
}

export async function generateAndStorePdf(dbOcc: DbOccurrence): Promise<string | null> {
  try {
    // Load logo first
    const logoBase64 = await loadLogoBase64();

    // Ensure public status token exists for QR code
    let publicToken = dbOcc.public_token;

    if (!publicToken) {
      // Generate a new token if one doesn't exist
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      publicToken = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

      // Save it to the database immediately
      const { error: tokenError } = await supabase
        .from("occurrences")
        .update({ public_token: publicToken })
        .eq("id", dbOcc.id);

      if (tokenError) {
        console.error("Error generating public token for PDF:", tokenError);
      }
    }

    // Fetch first image attachment (if any)
    let firstImageBase64: string | undefined;

    const { data: attachments } = await supabase
      .from("occurrence_attachments")
      .select("file_url, file_type")
      .eq("occurrence_id", dbOcc.id)
      .limit(1);

    if (attachments && attachments.length > 0) {
      const att = attachments[0];
      // Only process if it is an image
      if (att.file_type && att.file_type.startsWith("image/")) {
        try {
          // Download the image
          const { data: blob } = await supabase.storage
            .from("occurrence-attachments")
            .download(att.file_url);

          if (blob) {
            // Convert blob to base64
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(buffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            firstImageBase64 = `data:${att.file_type};base64,${base64}`;
          }
        } catch (err) {
          console.error("Error downloading image for PDF:", err);
        }
      }
    }

    // Transform to PDF format (including publicToken and image)
    const occurrence = {
      ...transformToPdfFormat(dbOcc),
      publicToken: publicToken || undefined,
      firstImageBase64
    };

    // Generate PDF with logo and attachments
    const doc = generateOccurrencePDF({
      occurrence: occurrence as any,
      includeHistory: true,
      includeOutcome: true,
      includeCapa: true,
      includeAttachments: !!firstImageBase64,
      anonymize: false,
      logoBase64: logoBase64 || undefined,
    });

    // Convert to blob
    const pdfBlob = doc.output("blob");
    const fileName = `${dbOcc.protocolo.replace(/\//g, "-")}_conclusao.pdf`;
    const filePath = `${dbOcc.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("occurrence-reports")
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading PDF:", error);
      return null;
    }

    // Store the file path (not URL) - we'll generate signed URLs when needed
    const { error: updateError } = await supabase
      .from("occurrences")
      .update({
        pdf_conclusao_url: filePath,
        pdf_gerado_em: new Date().toISOString(),
        // Ensure public_token is updated in local state/DB view if we just generated it
        public_token: publicToken
      })
      .eq("id", dbOcc.id);

    if (updateError) {
      console.error("Error updating occurrence with PDF URL:", updateError);
    }

    // Generate signed URL for immediate access
    const { data: signedData } = await supabase.storage
      .from("occurrence-reports")
      .createSignedUrl(filePath, 3600);

    return signedData?.signedUrl || null;
  } catch (error) {
    console.error("Error generating and storing PDF:", error);
    return null;
  }
}

