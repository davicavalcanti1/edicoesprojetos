export type DispenserStatus = "Faltando insumo" | "Sujo" | "Quebrado" | "Outro";
export type BanheiroProblem = "Falta de insumo" | "Sujo" | "Quebrado" | "Outro";
export type ArCondicionadoRequestType = "Manutenção IMAGO" | "Manutenção terceirizada" | "Limpeza de dreno (terceirizada)";

export interface QrFormBaseParams {
    tipo: string;
    id_qrcode: string;
    localizacao?: string;
    [key: string]: string | undefined;
}

export interface ArCondicionadoParams extends QrFormBaseParams {
    sala?: string;
    modelo?: string;
    numero_serie?: string;
    marca?: string;
}

// Payload format for the Webhook
export interface QrWebhookPayload {
    tipo: "dispenser" | "banheiro" | "banheiro_ralo" | "ar_condicionado" | "servico_terceirizado";
    id_qrcode: number | string;
    localizacao: string;
    dados_usuario: Record<string, any>;
    timestamp: string;
    // Optional metadata from URL
    metadata?: Record<string, any>;
}
