// Script to clean up duplicate PersonTypes
// Run this with: npx tsx scripts/cleanup-duplicate-person-types.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Cleaning up duplicate PersonTypes...\n')

    // Get all person types grouped by name
    const allTypes = await prisma.personType.findMany({
        orderBy: [
            { name: 'asc' },
            { system: 'desc' },      // System types first
            { tenantId: 'asc' },     // null first (system), then tenant-specific
            { createdAt: 'asc' }     // Oldest first
        ],
        include: {
            _count: {
                select: { persons: true }
            }
        }
    })

    // Group by name
    const typesByName = new Map<string, typeof allTypes>()
    for (const type of allTypes) {
        if (!typesByName.has(type.name)) {
            typesByName.set(type.name, [])
        }
        typesByName.get(type.name)!.push(type)
    }

    let totalDeleted = 0

    // Process each group
    for (const [name, types] of typesByName.entries()) {
        if (types.length <= 1) {
            console.log(`✅ "${name}" - No duplicates`)
            continue
        }

        console.log(`\n⚠️  Found ${types.length} entries for "${name}"`)

        // Keep the system type with null tenantId, or the oldest one
        const keepType = types.find(t => t.system && t.tenantId === null) || types[0]
        const duplicates = types.filter(t => t.id !== keepType.id)

        console.log(`   Keeping: ID ${keepType.id} (system: ${keepType.system}, tenantId: ${keepType.tenantId || 'null'}, persons: ${keepType._count.persons})`)

        for (const duplicate of duplicates) {
            console.log(`   🗑️  Deleting: ID ${duplicate.id} (system: ${duplicate.system}, tenantId: ${duplicate.tenantId || 'null'}, persons: ${duplicate._count.persons})`)

            // First, reassign any persons using this duplicate type to the kept type
            if (duplicate._count.persons > 0) {
                console.log(`      → Reassigning ${duplicate._count.persons} person associations...`)

                // Get all associations with this duplicate
                const associations = await prisma.personPersonType.findMany({
                    where: { personTypeId: duplicate.id }
                })

                for (const assoc of associations) {
                    // Check if person already has the kept type
                    const existing = await prisma.personPersonType.findUnique({
                        where: {
                            personId_personTypeId: {
                                personId: assoc.personId,
                                personTypeId: keepType.id
                            }
                        }
                    })

                    if (!existing) {
                        // Update the association to point to the kept type
                        await prisma.personPersonType.update({
                            where: {
                                personId_personTypeId: {
                                    personId: assoc.personId,
                                    personTypeId: duplicate.id
                                }
                            },
                            data: {
                                personTypeId: keepType.id
                            }
                        })
                    } else {
                        // Person already has the kept type, just delete this duplicate association
                        await prisma.personPersonType.delete({
                            where: {
                                personId_personTypeId: {
                                    personId: assoc.personId,
                                    personTypeId: duplicate.id
                                }
                            }
                        })
                    }
                }
            }

            // Now delete the duplicate type
            await prisma.personType.delete({
                where: { id: duplicate.id }
            })

            totalDeleted++
        }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate PersonType(s)`)

    // Show final count
    const finalCount = await prisma.personType.count()
    console.log(`📊 Total PersonTypes remaining: ${finalCount}`)
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
