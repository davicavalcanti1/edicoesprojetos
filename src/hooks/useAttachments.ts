import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Attachment {
  id: string;
  origin_id: string;
  origin_table: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  is_image: boolean;
  uploaded_em: string;
}

// Fetch attachments with signed URLs
export function useAttachmentsWithSignedUrls(originId: string | undefined, originTable: string) {
  return useQuery({
    queryKey: ["attachments-signed", originTable, originId],
    queryFn: async () => {
      if (!originId || !originTable) return [];

      let query = supabase
        .from("attachments" as any)
        .select("*")
        .order("uploaded_at", { ascending: true });

      // Apply specific FK filter
      switch (originTable) {
        case 'ocorrencias_laudo':
          query = query.eq('ocorrencia_laudo_id', originId);
          break;
        case 'ocorrencias_adm':
          query = query.eq('ocorrencia_adm_id', originId);
          break;
        case 'ocorrencias_enf':
          query = query.eq('ocorrencia_enf_id', originId);
          break;
        case 'chamados_dispenser':
          query = query.eq('chamado_dispenser_id', originId);
          break;
        case 'chamados_banheiro':
          query = query.eq('chamado_banheiro_id', originId);
          break;
        case 'chamados_ar_condicionado':
          query = query.eq('chamado_ar_condicionado_id', originId);
          break;
        case 'ocorrencia_paciente':
          query = query.eq('ocorrencia_paciente_id', originId);
          break;
        case 'ocorrencia_livre':
          query = query.eq('ocorrencia_livre_id', originId);
          break;
        default:
          return [];
      }

      const { data, error } = await query;

      if (error) throw error;

      // Generate signed URLs
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (att: any) => {
          const { data: urlData } = await supabase.storage
            .from("attachments")
            .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

          return {
            ...att,
            is_image: att.is_image ?? isImageMimeType(att.file_type),
            signed_url: urlData?.signedUrl || null,
          };
        })
      );

      return attachmentsWithUrls as (Attachment & { signed_url: string | null })[];
    },
    enabled: !!originId && !!originTable,
  });
}

// Upload attachments
export function useUploadAttachments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth(); // Need tenant_id

  return useMutation({
    mutationFn: async ({
      originId,
      originTable,
      files,
      userId,
    }: {
      originId: string;
      originTable: string;
      files: File[];
      userId: string;
    }) => {
      if (!profile?.tenant_id) throw new Error("Tenant ID not found");

      const uploadedAttachments: Attachment[] = [];

      for (const file of files) {
        const isImage = isImageMimeType(file.type);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = `${originTable}/${originId}/${fileName}`;

        // Upload to storage 'attachments'
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Erro ao fazer upload de ${file.name}: ${uploadError.message}`);
        }

        // Insert into database 'attachments'
        const payload: any = {
          tenant_id: profile.tenant_id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: filePath,
          is_image: isImage,
          uploaded_by: userId,
          // Generic tag for filtering if needed
          tag: 'upload',
        };

        // Map originTable to specific FK column
        switch (originTable) {
          case 'ocorrencias_laudo':
            payload.ocorrencia_laudo_id = originId;
            break;
          case 'ocorrencias_adm':
            payload.ocorrencia_adm_id = originId;
            break;
          case 'ocorrencias_enf':
            payload.ocorrencia_enf_id = originId;
            break;
          case 'chamados_dispenser':
            payload.chamado_dispenser_id = originId;
            break;
          case 'chamados_banheiro':
            payload.chamado_banheiro_id = originId;
            break;
          case 'chamados_ar_condicionado':
            payload.chamado_ar_condicionado_id = originId;
            break;
          case 'ocorrencia_paciente':
            payload.ocorrencia_paciente_id = originId;
            break;
          case 'ocorrencia_livre':
            payload.ocorrencia_livre_id = originId;
            break;
          default:
            throw new Error(`Tabela de origem desconhecida: ${originTable}`);
        }

        const { data, error: insertError } = await supabase
          .from("attachments" as any)
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          // Try to clean up file
          await supabase.storage.from("attachments").remove([filePath]);
          throw new Error(`Erro ao registrar ${file.name}: ${insertError.message}`);
        }

        uploadedAttachments.push({
          ...data,
          is_image: isImage,
        } as Attachment);
      }

      return uploadedAttachments;
    },
    onSuccess: (_, { originId, originTable }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments-signed", originTable, originId] });
    },
    onError: (error) => {
      // Toast is handled by component usually, but we can do it here too
      console.error("Error uploading:", error);
    },
  });
}


// Get signed URLs for a list
export async function getSignedUrlsForAttachments(attachments: Attachment[]): Promise<(Attachment & { signed_url: string })[]> {
  const results = await Promise.all(
    attachments.map(async (att) => {
      const { data } = await supabase.storage
        .from("attachments")
        .createSignedUrl(att.file_url, 60 * 60 * 24 * 7);

      return {
        ...att,
        signed_url: data?.signedUrl || "",
      };
    })
  );

  return results;
}

function isImageMimeType(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
