export const EmailTemplates = {
    rentalCreated: (rentalId: string, customerName: string, equipmentList: string[]) => `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Nova Locação Registrada</h2>
            <p>Olá <strong>${customerName}</strong>,</p>
            <p>Sua locação <strong>#${rentalId.slice(0, 8).toUpperCase()}</strong> foi registrada com sucesso.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Itens Locados:</h3>
                <ul style="padding-left: 20px;">
                    ${equipmentList.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <p>Se tiver dúvidas, entre em contato conosco.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">Locnos Equipamentos</p>
        </div>
    `,

    statusChanged: (rentalId: string, customerName: string, newStatus: string) => `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2563eb;">Atualização de Status</h2>
            <p>Olá <strong>${customerName}</strong>,</p>
            <p>O status da sua locação <strong>#${rentalId.slice(0, 8).toUpperCase()}</strong> mudou para:</p>
            
            <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 10px 20px; border-radius: 50px; font-weight: bold; margin: 10px 0;">
                ${newStatus}
            </div>
            
            <p>Acompanhe pelo painel do cliente.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">Locnos Equipamentos</p>
        </div>
    `
}
