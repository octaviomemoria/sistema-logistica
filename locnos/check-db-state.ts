
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking database state...')

    const userCount = await prisma.user.count()
    console.log(`Total Users: ${userCount}`)

    const users = await prisma.user.findMany({
        include: { tenant: true }
    })

    console.log('Users found:', JSON.stringify(users, null, 2))

    const tenantCount = await prisma.tenant.count()
    console.log(`Total Tenants: ${tenantCount}`)

    const tenants = await prisma.tenant.findMany()
    console.log('Tenants found:', JSON.stringify(tenants, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
