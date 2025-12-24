import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
    try {
        console.log('🌱 Creating admin user...')

        const hashedPassword = await bcrypt.hash('admin123', 10)

        const admin = await prisma.user.upsert({
            where: { email: 'admin@locnos.com.br' },
            update: {},
            create: {
                email: 'admin@locnos.com.br',
                name: 'Administrador',
                password: hashedPassword,
                role: 'ADMIN'
            }
        })

        console.log('✅ Admin user created:', admin.email)
    } catch (error) {
        console.error('❌ Error creating admin:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

createAdmin()
