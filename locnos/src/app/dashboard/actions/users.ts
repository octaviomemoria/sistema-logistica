'use server'

import { prisma } from '@/lib/prisma'

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: {
                name: 'asc'
            }
        })
        return { success: true, data: users }
    } catch (error) {
        console.error('Failed to fetch users:', error)
        return { success: false, error: 'Failed to fetch users' }
    }
}
