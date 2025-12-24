'use server'

import { prisma } from '@/lib/prisma'

export type SearchResult = {
    id: string
    type: 'RENTAL' | 'PERSON' | 'EQUIPMENT'
    title: string
    subtitle: string
    url: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const results: SearchResult[] = []

    // 1. Search Persons
    const people = await prisma.person.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        take: 3
    })
    people.forEach(p => results.push({
        id: p.id,
        type: 'PERSON',
        title: p.name,
        subtitle: p.email || p.phone || 'Sem contato',
        url: `/dashboard/persons?search=${p.name}`
    }))

    // 2. Search Rentals (by ID or Person Name)
    const rentals = await prisma.rental.findMany({
        where: {
            OR: [
                { id: { contains: query, mode: 'insensitive' } },
                { person: { name: { contains: query, mode: 'insensitive' } } }
            ]
        },
        include: { person: true },
        take: 3,
        orderBy: { createdAt: 'desc' }
    })
    rentals.forEach(r => results.push({
        id: r.id,
        type: 'RENTAL',
        title: `Locação #${r.id.slice(0, 8)}`,
        subtitle: `${r.person.name} - ${r.status}`,
        url: `/dashboard/contracts?search=${r.id}` // Ideally drill down
    }))

    // 3. Search Equipment
    const equipment = await prisma.equipment.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        take: 3
    })
    equipment.forEach(e => results.push({
        id: e.id,
        type: 'EQUIPMENT',
        title: e.name,
        subtitle: `Disp: ${e.totalQty - e.rentedQty}`,
        url: `/dashboard/inventory?search=${e.id}`
    }))

    return results
}
