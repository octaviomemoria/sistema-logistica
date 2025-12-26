import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Updating admin user to use new Role system...')

    // 1. Buscar o tenant e o role de Administrador
    const tenant = await prisma.tenant.findFirst({
        where: { document: '00.000.000/0001-91' }
    })

    if (!tenant) {
        console.log('❌ Tenant not found')
        return
    }

    const adminRole = await prisma.role.findFirst({
        where: {
            name: 'Administrador',
            tenantId: tenant.id
        }
    })

    if (!adminRole) {
        console.log('❌ Admin role not found')
        return
    }

    // 2. Update existing admin user
    const user = await prisma.user.findUnique({
        where: { email: 'admin@locnos.com' }
    })

    if (!user) {
        console.log('❌ Admin user not found')
        return
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            roleId: adminRole.id,
            status: 'ACTIVE',
            isActive: true,
            lastLoginAt: null
        }
    })

    console.log('✅ Admin user updated successfully!')
    console.log(`   User: ${user.email}`)
    console.log(`   Role: ${adminRole.name}`)
    console.log(`   Tenant: ${tenant.name}`)
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
