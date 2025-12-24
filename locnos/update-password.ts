import { hash } from 'bcryptjs'
import { prisma } from './src/lib/prisma'

async function main() {
    const email = 'admin@locnos.com.br'
    const password = 'admin123'
    const hashedPassword = await hash(password, 12)

    console.log(`Updating password for ${email}...`)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Octavio de Costa'
        },
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            name: 'Octavio de Costa'
        }
    })

    console.log('User updated successfully:', user.email)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
