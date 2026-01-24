export type AuditAction =
    | "occurrence_create"
    | "occurrence_view"
    | "occurrence_update"
    | "occurrence_delete"
    | "user_login"
    | "user_logout"
    | "sensitive_data_access"
    | "triage_set"
    | "status_change"
    | "pdf_export";

export const auditActionLabels: Record<AuditAction, string> = {
    occurrence_create: "Criação de Ocorrência",
    occurrence_view: "Visualização",
    occurrence_update: "Edição",
    occurrence_delete: "Exclusão",
    user_login: "Login",
    user_logout: "Logout",
    sensitive_data_access: "Acesso a Dados Sensíveis",
    triage_set: "Triagem Definida",
    status_change: "Mudança de Status",
    pdf_export: "Exportação de PDF",
};

export const rolePermissions: Record<string, string[]> = {
    admin: [
        "view_all_occurrences",
        "edit_all_occurrences",
        "delete_occurrences",
        "manage_users",
        "view_audit_logs",
        "export_reports",
        "manage_settings",
    ],
    user: [
        "create_occurrences",
        "view_own_occurrences",
        "edit_own_occurrences",
        "view_public_dashboard",
    ],
    rh: [
        "create_occurrences",
        "view_administrative",
        "view_public_dashboard"
    ],
    enfermagem: [
        "create_occurrences",
        "view_nursing",
        "view_public_dashboard"
    ]
};

export const dataRetentionPolicies = {
    audit_logs: {
        retentionDays: 365,
        description: "Logs de auditoria e segurança",
    },
    occurrences: {
        retentionDays: 1825, // 5 years
        description: "Registros de ocorrências e incidentes",
    },
    sensitive_data: {
        retentionDays: 1825,
        description: "Dados identificáveis de pacientes",
    },
};
