import { QrWebhookPayload } from "@/types/qr-forms";

// TODO: Replace with actual N8n webhook URL
const N8N_WEBHOOK_URL = "https://n8n.imagoradiologia.cloud/webhook/Tickets";

export async function sendQrForm(payload: QrWebhookPayload): Promise<boolean> {
    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Webhook error:", response.statusText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending QR form:", error);
        return false;
    }
}
