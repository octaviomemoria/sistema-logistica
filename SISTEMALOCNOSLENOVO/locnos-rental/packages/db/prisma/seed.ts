import { PrismaClient, Role, RateType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Units
  const unit = await prisma.unit.upsert({
    where: { code: 'MATRIZ' },
    update: {},
    create: { code: 'MATRIZ', name: 'Matriz', address: 'Rua Central, 100', city: 'São Paulo', state: 'SP', country: 'BR' },
  })

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@locnos.com' },
    update: {},
    create: { email: 'admin@locnos.com', name: 'Admin', password: '$2a$10$replace_with_hash', role: Role.ADMIN, unitId: unit.id },
  })

  // Categories
  const cat = await prisma.category.create({ data: { name: 'Betoneiras' } })

  // Equipment model
  const model = await prisma.equipmentModel.create({
    data: {
      name: 'Betoneira 400L',
      description: 'Betoneira 400 litros',
      dailyRate: 120.00,
      weeklyRate: 600.00,
      monthlyRate: 2000.00,
      categoryId: cat.id,
      barcodeSku: 'BET-400L',
    }
  })

  // Items
  const item1 = await prisma.equipmentItem.create({ data: { modelId: model.id, unitId: unit.id, serialNumber: 'SN-001', status: 'AVAILABLE' } })
  const item2 = await prisma.equipmentItem.create({ data: { modelId: model.id, unitId: unit.id, serialNumber: 'SN-002', status: 'AVAILABLE' } })

  // Customer
  const customer = await prisma.customer.create({ data: { name: 'Construtora ABC', email: 'contato@abc.com.br', documentId: '12.345.678/0001-00' } })

  // Sample reservation
  const start = new Date()
  const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const res = await prisma.reservation.create({
    data: {
      customerId: customer.id,
      unitId: unit.id,
      startDate: start,
      endDate: end,
      status: 'PENDING',
      items: {
        create: [
          { itemId: item1.id, rateType: RateType.DAILY, rateValue: 120.00 },
        ]
      },
      quoteTotal: 360.00,
    }
  })

  console.log({ unit, admin, model, item1, item2, customer, res })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
