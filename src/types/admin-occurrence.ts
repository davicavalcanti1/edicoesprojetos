export interface Attachment {
    name: string;
    url: string;
    type: string;
}

export interface AdminOccurrenceRecord {
    id: string;
    protocolo: string;
    descricao: string;
    criado_por: string;
    created_at: string;
    criado_em?: string;
    tenant_id: string;
    employee_name: string;
    type: string;
    subtype: string;
    attachments: Attachment[]; // JSONB
    coordinator_signature_path: string | null;
    employee_signature_path: string | null;
    status: string;
    signed_at: string | null;
    occurrence_date: string;
    titulo?: string;
    categoria?: string;
}
