
import { Prisma } from '@prisma/client'

export type TaskWithDetails = Prisma.TaskGetPayload<{
    include: {
        subtasks: true
        responsible: true
    }
}>
