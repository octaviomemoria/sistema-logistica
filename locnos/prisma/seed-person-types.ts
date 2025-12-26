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
            where: {
                name_tenantId: {
                    name: type.name,
                    tenantId: null  // System types don't belong to a tenant
                }
            },
            update: {
                color: type.color,  // Update color if it changes
                system: type.system
            },
            create: {
                ...type,
                tenantId: null  // Explicitly set null for system types
            },
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
