import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../prisma'
import { asaas, AsaasCustomer, AsaasPayment } from '../services/asaas'

export async function registerFinanceRoutes(app: FastifyInstance) {
  // Create boleto invoice via Asaas for a contract
  app.post('/invoices', async (req, reply) => {
    const schema = z.object({
      contractId: z.string(),
      amount: z.number().positive(),
      dueDate: z.coerce.date(),
      description: z.string().optional()
    })
    const body = schema.parse((req as any).body)

    const contract = await prisma.contract.findUnique({
      where: { id: body.contractId },
      include: { customer: true }
    })
    if (!contract) return reply.code(404).send({ message: 'Contrato não encontrado' })

    // Ensure Asaas customer exists
    let asaasCustomerId = contract.customer.asaasCustomerId
    if (!asaasCustomerId) {
      const payload = {
        name: contract.customer.name,
        email: contract.customer.email,
        cpfCnpj: contract.customer.documentId,
        mobilePhone: contract.customer.phone,
      }
      const created = await asaas.post<AsaasCustomer>('/customers', payload).then(r => r.data)
      asaasCustomerId = created.id
      await prisma.customer.update({ where: { id: contract.customer.id }, data: { asaasCustomerId } })
    }

    // Create boleto payment
    const payPayload = {
      customer: asaasCustomerId,
      billingType: 'BOLETO',
      value: body.amount,
      dueDate: body.dueDate.toISOString().substring(0,10),
      description: body.description ?? `Contrato ${contract.id}`,
    }
    const payment = await asaas.post<AsaasPayment>('/payments', payPayload).then(r => r.data)

    const invoice = await prisma.invoice.create({
      data: {
        contractId: contract.id,
        amount: body.amount as any,
        dueDate: body.dueDate,
        status: 'OPEN',
        boletoUrl: (payment as any).bankSlipUrl || (payment as any).invoiceUrl || null,
        asaasPaymentId: payment.id,
      }
    })

    return reply.code(201).send(invoice)
  })
}
