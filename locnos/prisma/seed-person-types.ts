import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding PersonTypes...')

    const personTypes = [
        { name: 'Cliente', color: '#3B82F6', system: true },      // Blue
        { name: 'Fornecedor', color: '#10B981', system: true },   // Green
        { name: 'Freteiro', color: '#F59E0B', system: true },     // Amber
        { name: 'Funcionário', color: '#8B5CF6', system: true },  // Purple
        { name: 'Parceiro', color: '#EC4899', system: true },     // Pink
        { name: 'Locador', color: '#14B8A6', system: true },      // Teal
    ]

    for (const type of personTypes) {
        await prisma.personType.upsert({
            where: { name: type.name },
            update: {},
            create: type,
        })
        console.log(`✓ Created/Updated PersonType: ${type.name}`)
    }

    console.log('\n✅ Seed completed!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
