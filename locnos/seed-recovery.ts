
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding recovery data (Idempotent)...')

  // 1. Ensure Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { document: '00.000.000/0001-91' }
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Empresa Principal',
        document: '00.000.000/0001-91',
        active: true,
      }
    })
    console.log('Created Tenant:', tenant.id)
  } else {
    console.log('Tenant already exists:', tenant.id)
  }

  // 2. Ensure Admin User
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@locnos.com' }
  })

  if (!existingUser) {
    const hashedPassword = await hash('123456', 10)
    const user = await prisma.user.create({
      data: {
        email: 'admin@locnos.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    })
    console.log('Created Admin User:', user.email)
  } else {
    console.log('Admin User already exists:', existingUser.email)
    // Ensure tenant association
    if (existingUser.tenantId !== tenant.id) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { tenantId: tenant.id }
      })
      console.log('Updated Admin User tenant link')
    }
  }

  // 3. Create Basic Person Types
  const personTypes = ['Cliente', 'Fornecedor', 'Parceiro']
  for (const typeName of personTypes) {
    const existing = await prisma.personType.findFirst({
      where: {
        name: typeName,
        tenantId: tenant.id
      }
    })

    if (!existing) {
      await prisma.personType.create({
        data: {
          name: typeName,
          system: true,
          tenantId: tenant.id
        }
      })
      console.log(`Created PersonType: ${typeName}`)
    } else {
      console.log(`PersonType exists: ${typeName}`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
