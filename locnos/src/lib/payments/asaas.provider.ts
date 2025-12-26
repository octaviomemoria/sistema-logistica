import { PaymentProvider, CreateChargeDTO, ChargeResult, PaymentStatus, WebhookEvent } from "./provider.interface";
import { prisma } from "@/lib/prisma";

export class AsaasProvider implements PaymentProvider {
    private apiKey: string;
    private baseUrl: string;
    private tenantId: string;

    constructor(apiKey: string, environment: 'SANDBOX' | 'PRODUCTION', tenantId: string) {
        this.apiKey = apiKey;
        this.tenantId = tenantId;
        this.baseUrl = environment === 'SANDBOX'
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3';
    }

    private async log(direction: 'INBOUND' | 'OUTBOUND', endpoint: string, status: number, payload: any, response: any) {
        try {
            await prisma.integrationLog.create({
                data: {
                    provider: 'ASAAS',
                    direction,
                    endpoint,
                    status,
                    payload,
                    response,
                    tenantId: this.tenantId
                }
            });
        } catch (e) {
            console.error("Failed to log integration", e);
        }
    }

    async createCharge(data: CreateChargeDTO): Promise<ChargeResult> {
        const payload = {
            customer: data.customerDocument, // Simplified logic: In real Asaas, need to create Customer first or find by Email
            value: data.amount,
            dueDate: data.dueDate.toISOString().split('T')[0],
            description: data.description,
            externalReference: data.externalReference
        };

        // MOCK REQUEST
        console.log(`[ASAAS MOCK] Creating charge: ${JSON.stringify(payload)}`);

        const mockResponse = {
            id: `pay_${Math.random().toString(36).substr(2, 9)}`,
            invoiceUrl: "https://sandbox.asaas.com/fatura/preview/mock",
            status: 'PENDING' as PaymentStatus,
            bankSlipUrl: "https://...",
            pixQrCode: "..."
        };

        await this.log('OUTBOUND', '/payments', 200, payload, mockResponse);

        return mockResponse;
    }

    async cancelCharge(id: string): Promise<void> {
        console.log(`[ASAAS MOCK] Cancelling charge: ${id}`);
        await this.log('OUTBOUND', `/payments/${id}`, 200, { action: 'cancel' }, { deleted: true });
    }

    async syncStatus(id: string): Promise<PaymentStatus> {
        return 'PENDING';
    }

    async handleWebhook(payload: any, signature: string): Promise<WebhookEvent> {
        // Mock verification
        await this.log('INBOUND', 'WEBHOOK', 200, payload, { processed: true });

        const eventMap: Record<string, string> = {
            'PAYMENT_RECEIVED': 'PAYMENT_RECEIVED',
            'PAYMENT_OVERDUE': 'PAYMENT_OVERDUE'
        };

        return {
            event: (eventMap[payload.event] || 'UNKNOWN') as any,
            providerId: payload.payment.id,
            payload: payload
        };
    }
}
