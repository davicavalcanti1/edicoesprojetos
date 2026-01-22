
import { supabase } from "@/integrations/supabase/client";

/**
 * Faz upload de uma lista de arquivos para o bucket 'maintenance-photos'
 * Retorna array com as URLs públicas.
 */
export async function uploadMaintenancePhotos(files: File[]): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of files) {
        // Gera um nome único: timestamp-random-nomeoriginal
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('maintenance-photos')
            .upload(filePath, file);

        if (error) {
            console.error("Erro upload:", error);
            continue; // Pula falhas ou poderia lançar erro
        }

        const { data: { publicUrl } } = supabase.storage
            .from('maintenance-photos')
            .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
}

/**
 * Gera protocolo seguro via RPC do Supabase
 */
export async function generateSecureProtocol(): Promise<string> {
    // @ts-ignore
    const { data, error } = await supabase.rpc('generate_daily_protocol');

    if (error) {
        console.error("Erro gerando protocolo:", error);
        // Fallback local caso RPC falhe (para não travar operação crítica, embora o ideal seja retry)
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `${date}-${random}`;
    }

    return data as string;
}
