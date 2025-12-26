'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function getSession() {
    return await getServerSession(authOptions)
}

interface TaskFilters {
    search?: string
    status?: string
    priority?: string
    responsibleId?: string
    dueDateFrom?: Date
    dueDateTo?: Date
}

export async function getTasks(filters?: TaskFilters) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Build where clause
        const where: any = {
            tenantId: session.user.tenantId
        }

        // Search filter (title or description)
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ]
        }

        // Status filter
        if (filters?.status) {
            where.status = filters.status
        }

        // Priority filter
        if (filters?.priority) {
            where.priority = filters.priority
        }

        // Responsible filter
        if (filters?.responsibleId) {
            where.responsibleId = filters.responsibleId
        }

        // Date range filter
        if (filters?.dueDateFrom || filters?.dueDateTo) {
            where.dueDate = {}
            if (filters.dueDateFrom) {
                where.dueDate.gte = filters.dueDateFrom
            }
            if (filters.dueDateTo) {
                where.dueDate.lte = filters.dueDateTo
            }
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                subtasks: {
                    orderBy: { createdAt: 'asc' }
                },
                responsible: true
            },
            orderBy: [
                { status: 'asc' }, // PENDING first
                { dueDate: 'asc' }, // Soonest due first
                { createdAt: 'desc' }
            ]
        })
        return { success: true, data: tasks }
    } catch (error) {
        console.error('Failed to fetch tasks:', error)
        return { success: false, error: 'Failed to fetch tasks' }
    }
}

export async function createTask(data: {
    title: string;
    responsibleId?: string;
    dueDate?: Date;
    description?: string;
    priority?: string;
    isRecurring?: boolean;
    recurrenceType?: string;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    reminderEnabled?: boolean;
    reminderDateTime?: Date;
}) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Validate responsible belongs to tenant (optional but recommended)
        // Ignoring for MVP validation to avoid extra query

        const task = await prisma.task.create({
            data: {
                title: data.title,
                responsibleId: data.responsibleId,
                dueDate: data.dueDate,
                description: data.description,
                status: 'PENDING',
                priority: data.priority || 'NORMAL',
                tenantId: session.user.tenantId,
                createdById: session.user.id,
                // Recurring task fields
                isRecurring: data.isRecurring || false,
                recurrenceType: data.recurrenceType as any,
                recurrenceInterval: data.recurrenceInterval,
                recurrenceEndDate: data.recurrenceEndDate,
                // Reminder fields
                reminderEnabled: data.reminderEnabled || false,
                reminderDateTime: data.reminderDateTime,
                reminderSent: false,
            }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true, data: task }
    } catch (error) {
        console.error('Failed to create task:', error)
        return { success: false, error: 'Failed to create task' }
    }
}

export async function updateTask(id: string, data: {
    title?: string;
    status?: string;
    priority?: string;
    responsibleId?: string;
    dueDate?: Date | null;
    description?: string
}) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify task belongs to tenant
        const existing = await prisma.task.findUnique({
            where: { id },
            select: { tenantId: true }
        })

        if (!existing || existing.tenantId !== session.user.tenantId) {
            return { success: false, error: 'Not found or Access Denied' }
        }

        const task = await prisma.task.update({
            where: { id },
            data
        })
        revalidatePath('/dashboard/tasks')
        return { success: true, data: task }
    } catch (error) {
        console.error('Failed to update task:', error)
        return { success: false, error: 'Failed to update task' }
    }
}

export async function deleteTask(id: string) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify task belongs to tenant
        const existing = await prisma.task.findUnique({
            where: { id },
            select: { tenantId: true }
        })

        if (!existing || existing.tenantId !== session.user.tenantId) {
            return { success: false, error: 'Not found or Access Denied' }
        }

        await prisma.task.delete({
            where: { id }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete task:', error)
        return { success: false, error: 'Failed to delete task' }
    }
}

// Subtasks

export async function createSubtask(taskId: string, title: string) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify parent task belongs to tenant
        const parent = await prisma.task.findUnique({
            where: { id: taskId },
            select: { tenantId: true }
        })

        if (!parent || parent.tenantId !== session.user.tenantId) {
            return { success: false, error: 'Parent task not found or Access Denied' }
        }

        const subtask = await prisma.subtask.create({
            data: {
                taskId,
                title,
                completed: false,
                tenantId: session.user.tenantId
            }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true, data: subtask }
    } catch (error) {
        console.error('Failed to create subtask:', error)
        return { success: false, error: 'Failed to create subtask' }
    }
}

export async function toggleSubtask(id: string, completed: boolean) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify subtask belongs to tenant
        const existing = await prisma.subtask.findUnique({
            where: { id },
            select: { tenantId: true }
        })

        if (!existing || existing.tenantId !== session.user.tenantId) {
            // Fallback: check parent task tenant if subtask tenantId is somehow missing (legacy)
            // But we enforced tenantId on creation now. 
            // If legacy data exists without tenantId, this prevents access.
            return { success: false, error: 'Not found or Access Denied' }
        }

        const subtask = await prisma.subtask.update({
            where: { id },
            data: { completed }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true, data: subtask }
    } catch (error) {
        console.error('Failed to toggle subtask:', error)
        return { success: false, error: 'Failed to toggle subtask' }
    }
}

export async function deleteSubtask(id: string) {
    try {
        const session = await getSession()
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        const existing = await prisma.subtask.findUnique({
            where: { id },
            select: { tenantId: true }
        })

        if (!existing || existing.tenantId !== session.user.tenantId) {
            return { success: false, error: 'Not found or Access Denied' }
        }

        await prisma.subtask.delete({
            where: { id }
        })
        revalidatePath('/dashboard/tasks')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete subtask:', error)
        return { success: false, error: 'Failed to delete subtask' }
    }
}
