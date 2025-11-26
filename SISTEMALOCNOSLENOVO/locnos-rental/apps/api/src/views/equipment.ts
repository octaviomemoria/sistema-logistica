import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'
import { z } from 'zod'

export async function registerEquipmentRoutes(app: FastifyInstance) {
  app.get('/models', async () => {
    return prisma.equipmentModel.findMany({ include: { category: true, items: true } })
  })

  app.post('/models', async (req) => {
    const schema = z.object({
      name: z.string(),
      description: z.string().optional(),
      dailyRate: z.number(),
      weeklyRate: z.number().optional(),
      monthlyRate: z.number().optional(),
      categoryId: z.string().optional(),
      barcodeSku: z.string().optional()
    })
    const body = schema.parse((req as any).body)
    return prisma.equipmentModel.create({ data: body })
  })

  app.get('/items', async (req) => {
    return prisma.equipmentItem.findMany({ include: { model: true, unit: true } })
  })
}
