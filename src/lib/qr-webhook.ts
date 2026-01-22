import { supabase } from "@/integrations/supabase/client";
import { QrWebhookPayload } from "@/types/qr-forms";
import { generateProtocol } from "./protocol-utils";

const N8N_URLS = {
    dispenser: "https://n8n.imagoradiologia.cloud/webhook/Dispenser",
    banheiro: "https://n8n.imagoradiologia.cloud/webhook/Banheiro",
};

function formatGpMessage(payload: QrWebhookPayload, protocol: string): string {
    const { tipo, localizacao, dados_usuario } = payload;
    const baseUrl = "https://teste.imagoradiologia.cloud";

    if (tipo === "dispenser") {
        const linkFinalizar = `${baseUrl}/formularios/dispenser/finalizar?protocolo=${protocol}`;

        return `*CHAMADO ABERTO (DISPENSER DE ÁLCOOL)*
Protocolo: ${protocol}
Local: ${localizacao}
Status: ${dados_usuario.situacao}

Clique no link para finalizar o chamado:
${linkFinalizar}`;
    }

    if (tipo === "banheiro") {
        const linkFinalizar = `${baseUrl}/formularios/banheiro/finalizar?protocolo=${protocol}`;

        return `🚻 *CHAMADO ABERTO (BANHEIRO)*
Protocolo: ${protocol}
Local: ${localizacao}
Problema: ${dados_usuario.problema}
Descrição: ${dados_usuario.descricao}

Clique no link para finalizar o chamado:
${linkFinalizar}`;
    }

    return `📢 *NOVO CHAMADO - ${tipo.toUpperCase()}*
Local: ${localizacao}
Protocolo: ${protocol}
Dados: ${JSON.stringify(dados_usuario)}`;
}


export async function sendQrForm(payload: QrWebhookPayload): Promise<boolean> {
    try {
        console.log("Iniciando envio do formulário QR:", payload);

        // 1. Gerar Protocolo Único
        const protocol = generateProtocol();
        console.log("Protocolo gerado:", protocol);

        // 2. Obter usuário atual (necessário para salvar no Supabase)
        const { data: { user } } = await supabase.auth.getUser();

        // Se não houver usuário logado, tentaremos buscar um tenant padrão ou falhar.
        let tenantId = null;
        let userId = user?.id;

        if (userId) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("tenant_id")
                .eq("id", userId)
                .single();
            tenantId = profile?.tenant_id;
        } else {
            console.warn("Usuário não logado. Tentando salvar sem user_id.");
            const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
            tenantId = tenant?.id;
        }

        if (!tenantId) {
            throw new Error("Tenant ID não encontrado. Não é possível salvar o chamado.");
        }

        // 3. Salvar no Supabase
        const occurrenceData = {
            protocolo: protocol,
            tipo: "tecnica",
            subtipo: "predial",
            descricao_detalhada: `[QR Code - ${payload.tipo}] ${payload.localizacao}\n\n${JSON.stringify(payload.dados_usuario, null, 2)}`,
            status: "registrada",
            tenant_id: tenantId,
            criado_por: userId,
            dados_especificos: payload.dados_usuario,
            observacoes: payload.metadata ? JSON.stringify(payload.metadata) : null,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
        };

        // @ts-ignore
        const { error: dbError } = await supabase.from("occurrences").insert(occurrenceData);

        if (dbError) {
            console.error("Erro ao salvar no Supabase:", dbError);
            throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
        }

        console.log("Salvo no Supabase com sucesso.");

        // 4. Enviar para N8N (Apenas Dispenser e Banheiro)
        if (payload.tipo === "dispenser" || payload.tipo === "banheiro") {
            const webhookUrl = N8N_URLS[payload.tipo];

            if (webhookUrl) {
                const gpMessage = formatGpMessage(payload, protocol);

                // Event type específico conforme solicitado
                const eventType = payload.tipo === "banheiro" ? "abrir_banheiro" : "abrir";

                const n8nPayload = {
                    event_type: eventType,
                    protocol: protocol,
                    gp_message: gpMessage,
                    original_payload: payload
                };

                // O envio ao n8n pode falhar, mas não deve impedir o sucesso da operação (já salvo no banco)
                fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(n8nPayload),
                }).then(res => {
                    if (!res.ok) console.error("Falha ao enviar webhook N8N:", res.statusText);
                    else console.log("Webhook N8N enviado com sucesso.");
                }).catch(err => {
                    console.error("Erro de conexão com N8N:", err);
                });
            }
        }

        return true;
    } catch (error) {
        console.error("Error processing QR form:", error);
        return false;
    }
}
