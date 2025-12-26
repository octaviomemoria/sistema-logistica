import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Creating/updating admin user...')

    const email = 'admin@locnos.com.br'
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // First, ensure we have a default tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'default-tenant-id' },
        update: {},
        create: {
            id: 'default-tenant-id',
            name: 'Empresa Padrão',
            active: true
        }
    })

    console.log('✅ Tenant ensured:', tenant.name)

    // Create or get Admin role
    const adminRole = await prisma.role.upsert({
        where: {
            name_tenantId: {
                name: 'Administrador',
                tenantId: tenant.id
            }
        },
        update: {},
        create: {
            name: 'Administrador',
            description: 'Acesso total ao sistema',
            isSystem: true,
            isActive: true,
            tenantId: tenant.id
        }
    })

    console.log('✅ Admin role ensured:', adminRole.name)

    // Now create/update the admin user
    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            status: 'ACTIVE',
            isActive: true,
            roleId: adminRole.id
        },
        create: {
            email,
            name: 'Administrador',
            password: hashedPassword,
            status: 'ACTIVE',
            isActive: true,
            tenantId: tenant.id,
            roleId: adminRole.id
        }
    })

    console.log('✅ Admin user created/updated successfully!')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('👤 User ID:', admin.id)
    console.log('🏢 Tenant:', tenant.name)
    console.log('🎭 Role:', adminRole.name)
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
