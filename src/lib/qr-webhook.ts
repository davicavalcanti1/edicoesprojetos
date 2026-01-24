import { supabase } from "@/integrations/supabase/client";
import { QrWebhookPayload } from "@/types/qr-forms";

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

        // 1. Obter usuário atual
        const { data: { user } } = await supabase.auth.getUser();

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
            const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
            tenantId = tenant?.id;
        }

        if (!tenantId) {
            throw new Error("Tenant ID não encontrado.");
        }

        let tableName = "";
        let insertData: any = {
            tenant_id: tenantId,
            localizacao: payload.localizacao,
            status: 'aberto',
            criado_por: userId || null,
            solicitante_info: userId ? null : valuesToGuestInfo(payload.dados_usuario)
        };

        // Table routing
        switch (payload.tipo) {
            case 'ar_condicionado':
                tableName = "chamados_ar_condicionado";
                insertData.descricao = payload.dados_usuario.descricao || "Manutenção AC";
                insertData.modelo = payload.metadata?.modelo;
                insertData.numero_serie = payload.metadata?.numero_serie;
                insertData.tag_equipamento = payload.metadata?.tag;
                break;
            case 'dispenser':
                tableName = "chamados_dispenser";
                insertData.tipo_insumo = payload.metadata?.tipo_insumo || "Geral";
                insertData.problema = payload.dados_usuario.situacao;
                break;
            case 'banheiro':
                tableName = "chamados_banheiro";
                insertData.problema = payload.dados_usuario.problema;
                insertData.observacao = payload.dados_usuario.descricao;
                break;
            default:
                throw new Error("Tipo de formulário não suportado para envio direto.");
        }

        // 3. Insert and Get Protocol
        const { data, error: dbError } = await supabase
            .from(tableName as any)
            .insert(insertData)
            .select("protocolo")
            .single();

        if (dbError) {
            console.error(`Erro ao salvar no Supabase (${tableName}):`, dbError);
            throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
        }

        const protocol = (data as any).protocolo;
        console.log("Chamado criado com sucesso. Protocolo:", protocol);

        // 4. Enviar para N8N (Apenas Dispenser e Banheiro)
        if (payload.tipo === "dispenser" || payload.tipo === "banheiro") {
            const webhookUrl = N8N_URLS[payload.tipo];

            if (webhookUrl) {
                const gpMessage = formatGpMessage(payload, protocol);
                const eventType = payload.tipo === "banheiro" ? "abrir_banheiro" : "abrir";

                const n8nPayload = {
                    event_type: eventType,
                    protocol: protocol,
                    gp_message: gpMessage,
                    original_payload: payload
                };

                fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(n8nPayload),
                }).catch(err => console.error("Erro N8N:", err));
            }
        }

        return true;
    } catch (error) {
        console.error("Error processing QR form:", error);
        return false;
    }
}

function valuesToGuestInfo(values: any): any {
    if (!values) return null;
    return {
        nome: values.nome || values.solicitante,
        contato: values.telefone || values.contato
    };
}

