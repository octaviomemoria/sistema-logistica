// Script to debug what getPersonTypes returns
// Run this with: npx tsx scripts/debug-person-types.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Debugging getPersonTypes query...\n')

    // Simulate what the frontend action does
    const tenantId = 'clhk3f8ij0000vwog3vx03r1e' // Replace with your actual tenant ID if needed

    console.log(`Using tenantId: ${tenantId}\n`)

    // This is what the action does
    const personTypes = await prisma.personType.findMany({
        where: {
            OR: [
                { system: true },
                { tenantId }
            ]
        },
        orderBy: { name: 'asc' }
    })

    console.log(`📊 Found ${personTypes.length} PersonTypes:\n`)

    // Group by name to detect any duplicates
    const nameCount = new Map<string, number>()

    personTypes.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name}`)
        console.log(`   ID: ${type.id}`)
        console.log(`   Color: ${type.color}`)
        console.log(`   System: ${type.system}`)
        console.log(`   TenantId: ${type.tenantId || 'null'}`)
        console.log(`   Created: ${type.createdAt}`)
        console.log('')

        nameCount.set(type.name, (nameCount.get(type.name) || 0) + 1)
    })

    // Check for duplicates
    console.log('\n📋 Summary by name:')
    for (const [name, count] of nameCount.entries()) {
        const status = count > 1 ? '⚠️ DUPLICATE' : '✅'
        console.log(`   ${status} ${name}: ${count} occurrence(s)`)
    }

    // Try with different tenantId values
    console.log('\n\n🔍 Testing with NULL tenantId...')
    const systemTypesOnly = await prisma.personType.findMany({
        where: {
            OR: [
                { system: true },
                { tenantId: null }
            ]
        },
        orderBy: { name: 'asc' }
    })
    console.log(`Found ${systemTypesOnly.length} types`)

    // Show all person types without filter
    console.log('\n\n🔍 All PersonTypes in database (no filter):')
    const allTypes = await prisma.personType.findMany({
        orderBy: { name: 'asc' }
    })
    console.log(`Total: ${allTypes.length}`)
    allTypes.forEach(t => {
        console.log(`   - ${t.name} (system: ${t.system}, tenantId: ${t.tenantId || 'null'})`)
    })
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
