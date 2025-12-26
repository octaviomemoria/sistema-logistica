export interface PaymentProvider {
    createCharge(data: CreateChargeDTO): Promise<ChargeResult>;
    cancelCharge(id: string): Promise<void>;
    syncStatus(id: string): Promise<PaymentStatus>;
    handleWebhook(payload: any, signature: string): Promise<WebhookEvent>;
}

export interface CreateChargeDTO {
    customerName: string;
    customerDocument: string; // CPF/CNPJ
    amount: number;
    dueDate: Date;
    description: string;
    externalReference: string; // Our Title ID
}

export interface ChargeResult {
    id: string; // Provider ID
    invoiceUrl: string;
    status: PaymentStatus;
    qrCode?: string;
    digitableLine?: string;
}

export interface WebhookEvent {
    event: 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_REFUNDED' | 'UNKNOWN';
    providerId: string;
    payload: any;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
