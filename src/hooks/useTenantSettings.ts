import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TenantSettings {
  webhook_url?: string;
  webhook_enabled?: boolean;
}

// Function to trigger webhook via Edge Function (avoids CORS issues)
export async function triggerWebhook(
  webhookUrl: string,
  occurrenceData: {
    id: string;
    protocolo: string;
    tipo: string;
    subtipo: string;
    descricao: string;
    paciente_nome?: string | null;
    criado_em: string;
    criado_por_nome?: string;
  }
) {
  try {
    const payload = {
      evento: "nova_ocorrencia",
      timestamp: new Date().toISOString(),
      dados: {
        id: occurrenceData.id,
        protocolo: occurrenceData.protocolo,
        tipo: occurrenceData.tipo,
        subtipo: occurrenceData.subtipo,
        descricao: occurrenceData.descricao,
        paciente_nome: occurrenceData.paciente_nome || "Não informado",
        criado_em: occurrenceData.criado_em,
        criado_por: occurrenceData.criado_por_nome || "Sistema",
        link: `${window.location.origin}/ocorrencias/${occurrenceData.id}`,
      },
    };

    // Send via Edge Function to avoid CORS issues
    const { data, error } = await supabase.functions.invoke("send-webhook", {
      body: { payload, webhookUrl },
    });

    if (error) {
      console.error("[Webhook] Edge function error:", error);
      return false;
    }

    console.log("[Webhook] Response:", data);
    return data?.success ?? true;
  } catch (error) {
    console.error("[Webhook] Erro ao preparar payload:", error);
    return false;
  }
}

// Function to send generic data to a webhook (for n8n integrations)
export async function sendToWebhook(webhookUrl: string, payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.functions.invoke("send-webhook", {
      body: {
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
        },
        webhookUrl
      },
    });

    if (error) {
      console.error("[Webhook] Edge function error:", error);
      return false;
    }

    console.log("[Webhook] Response:", data);
    return data?.success ?? true;
  } catch (error) {
    console.error("[Webhook] Erro ao enviar para webhook:", error);
    return false;
  }
}
