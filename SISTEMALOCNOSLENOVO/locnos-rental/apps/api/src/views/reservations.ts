import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma'
import { z } from 'zod'

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart <= bEnd && bStart <= aEnd
}

export async function registerReservationRoutes(app: FastifyInstance) {
  app.get('/', async () => prisma.reservation.findMany({ include: { items: { include: { item: true } }, customer: true } }))

  app.post('/', async (req, reply) => {
    const schema = z.object({
      customerId: z.string(),
      unitId: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      items: z.array(z.object({ itemId: z.string(), rateType: z.enum(['DAILY','WEEKLY','MONTHLY','CUSTOM']), rateValue: z.number(), discount: z.number().optional() }))
    })
    const body = schema.parse((req as any).body)

    // Availability check for each item
    for (const it of body.items) {
      const itemId = it.itemId
      // Check overlapping reservations (PENDING, APPROVED)
      const resv = await prisma.reservationItem.findMany({
        where: {
          itemId,
          reservation: {
            status: { in: ['PENDING', 'APPROVED', 'CONVERTED'] }
          }
        },
        include: { reservation: true }
      })
      const hasResvConflict = resv.some(r => overlap(body.startDate, body.endDate, r.reservation.startDate, r.reservation.endDate))

      // Check active contracts
      const contr = await prisma.contractItem.findMany({
        where: {
          itemId,
          contract: { status: { in: ['ACTIVE', 'LATE'] } }
        },
        include: { contract: true }
      })
      const hasContractConflict = contr.some(c => overlap(body.startDate, body.endDate, c.contract.startDate, c.contract.endDate ?? new Date(8640000000000000)))

      if (hasResvConflict || hasContractConflict) {
        return reply.code(409).send({ message: `Item ${itemId} indisponível no período solicitado` })
      }
    }

    const quoteTotal = body.items.reduce((sum, it) => sum + it.rateValue, 0)

    const reservation = await prisma.reservation.create({
      data: {
        customerId: body.customerId,
        unitId: body.unitId,
        startDate: body.startDate,
        endDate: body.endDate,
        quoteTotal,
        items: { create: body.items.map(i => ({ itemId: i.itemId, rateType: i.rateType as any, rateValue: i.rateValue, discount: i.discount })) }
      },
      include: { items: true }
    })

    return reservation
  })
}
