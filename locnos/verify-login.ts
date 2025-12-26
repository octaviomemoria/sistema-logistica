
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@locnos.com'
    const password = '123456'

    console.log(`Checking login for ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log('User NOT FOUND.')
        return
    }

    console.log('User found:', user.id, user.role, user.tenantId)

    const isValid = await compare(password, user.password)
    console.log(`Password '123456' match: ${isValid}`)

    if (!isValid) {
        console.log('Hash in DB:', user.password)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
