import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'
import { z } from 'zod'

export async function registerCustomerRoutes(app: FastifyInstance) {
  app.get('/', async () => prisma.customer.findMany())

  app.post('/', async (req) => {
    const schema = z.object({ name: z.string(), email: z.string().email().optional(), phone: z.string().optional(), documentId: z.string().optional(), address: z.string().optional() })
    const body = schema.parse((req as any).body)
    return prisma.customer.create({ data: body })
  })
}
