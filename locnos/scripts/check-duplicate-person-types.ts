// Script to check for duplicate PersonTypes
// Run this with: npx tsx scripts/check-duplicate-person-types.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking for duplicate PersonTypes...\n')

    // Get all person types
    const personTypes = await prisma.personType.findMany({
        orderBy: [
            { name: 'asc' },
            { system: 'desc' },
            { createdAt: 'asc' }
        ],
        include: {
            _count: {
                select: { persons: true }
            }
        }
    })

    console.log(`📊 Total PersonTypes found: ${personTypes.length}\n`)

    // Group by name to find duplicates
    const typesByName = new Map<string, typeof personTypes>()

    for (const type of personTypes) {
        if (!typesByName.has(type.name)) {
            typesByName.set(type.name, [])
        }
        typesByName.get(type.name)!.push(type)
    }

    // Show duplicates
    let hasDuplicates = false
    for (const [name, types] of typesByName.entries()) {
        if (types.length > 1) {
            hasDuplicates = true
            console.log(`⚠️  DUPLICATE: "${name}" (${types.length} entries)`)
            types.forEach((type, index) => {
                console.log(`   ${index + 1}. ID: ${type.id}`)
                console.log(`      System: ${type.system}`)
                console.log(`      TenantId: ${type.tenantId || 'null'}`)
                console.log(`      Color: ${type.color}`)
                console.log(`      Persons using: ${type._count.persons}`)
                console.log(`      Created: ${type.createdAt}`)
                console.log('')
            })
        }
    }

    if (!hasDuplicates) {
        console.log('✅ No duplicates found!')
    }

    // Show all types grouped
    console.log('\n📋 All PersonTypes:')
    for (const [name, types] of typesByName.entries()) {
        console.log(`   - ${name} (${types.length} ${types.length > 1 ? '⚠️ DUPLICATE' : ''})`)
    }
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
