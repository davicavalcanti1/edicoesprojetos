import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PatientOccurrenceInput {
    paciente_nome_completo?: string;
    paciente_telefone?: string;
    paciente_data_nascimento?: string;
    descricao_detalhada: string;
    is_anonymous: boolean;
}

export function useCreatePatientOccurrence() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: PatientOccurrenceInput) => {
            // Need to get a tenant ID. 
            const { data: tenantData } = await supabase.from('tenants').select('id').limit(1).single();
            const tenantId = tenantData?.id;

            if (!tenantId) throw new Error("Sistema indisponível (Tenant not found)");

            // Generate protocol
            const { data: protocolo, error: protoError } = await supabase
                .rpc("generate_protocol_number", { p_tenant_id: tenantId });

            if (protoError) throw protoError;

            // Insert into NEW dedicated table
            const insertData: any = {
                tenant_id: tenantId,
                protocol: protocolo, // Note: column name is 'protocol' in new table
                description: data.descricao_detalhada,
                is_anonymous: data.is_anonymous,
                status: 'pendente'
            };

            if (!data.is_anonymous) {
                insertData.patient_name = data.paciente_nome_completo;
                insertData.patient_phone = data.paciente_telefone;
                insertData.patient_birth_date = data.paciente_data_nascimento;
            }

            const { error } = await supabase.from('patient_occurrences' as any).insert(insertData);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Ocorrência enviada com sucesso!", description: "Sua ocorrência foi registrada e será analisada." });
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
        }
    })
}
