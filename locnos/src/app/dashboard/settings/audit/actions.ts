'use server'

import { prisma } from '@/lib/prisma'
import { getTenantAuth, requirePermission } from '@/lib/permissions'
import { Prisma } from '@prisma/client'

// ========== AUDIT LOG ACTIONS ==========

export interface CreateAuditLogInput {
    action: string
    entityType: string
    entityId: string
    changes?: object
    metadata?: object
}

export interface AuditLogFilters {
    userId?: string
    entityType?: string
    entityId?: string
    action?: string
    startDate?: Date
    endDate?: Date
}

/**
 * Cria um registro de auditoria
 */
export async function createAuditLog(data: CreateAuditLogInput) {
    try {
        const { userId, tenantId } = await getTenantAuth()

        const log = await prisma.auditLog.create({
            data: {
                ...data,
                userId,
                tenantId,
                changes: data.changes as Prisma.JsonValue,
                metadata: data.metadata as Prisma.JsonValue
            }
        })

        return log
    } catch (error: any) {
        console.error('Erro ao criar log de auditoria:', error)
        // Não lançar erro para não quebrar operações
        return null
    }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(filters?: AuditLogFilters) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const where: Prisma.AuditLogWhereInput = {
            tenantId
        }

        if (filters?.userId) {
            where.userId = filters.userId
        }

        if (filters?.entityType) {
            where.entityType = filters.entityType
        }

        if (filters?.entityId) {
            where.entityId = filters.entityId
        }

        if (filters?.action) {
            where.action = filters.action
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {}
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate
            }
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 500 // Limitar a 500 registros mais recentes
        })

        return logs
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar logs de auditoria')
    }
}

/**
 * Busca logs de auditoria de uma entidade específica
 */
export async function getEntityAuditLogs(entityType: string, entityId: string) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const logs = await prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
                tenantId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return logs
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar histórico da entidade')
    }
}

/**
 * Busca atividades recentes do usuário
 */
export async function getUserActivity(userId?: string, limit: number = 50) {
    try {
        await requirePermission('users', 'VIEW')
        const { userId: currentUserId, tenantId } = await getTenantAuth()

        const targetUserId = userId || currentUserId

        // Verificar ownership
        const user = await prisma.user.findFirst({
            where: {
                id: targetUserId,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        const logs = await prisma.auditLog.findMany({
            where: {
                userId: targetUserId,
                tenantId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        return logs
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar atividades do usuário')
    }
}

/**
 * Estatísticas de auditoria
 */
export async function getAuditStats() {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const now = new Date()
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [total, last24hCount, last7dCount, byAction, byUser] = await Promise.all([
            // Total de logs
            prisma.auditLog.count({
                where: { tenantId }
            }),
            // Últimas 24h
            prisma.auditLog.count({
                where: {
                    tenantId,
                    createdAt: { gte: last24h }
                }
            }),
            // Últimos 7 dias
            prisma.auditLog.count({
                where: {
                    tenantId,
                    createdAt: { gte: last7d }
                }
            }),
            // Por ação
            prisma.auditLog.groupBy({
                by: ['action'],
                where: {
                    tenantId,
                    createdAt: { gte: last7d }
                },
                _count: true
            }),
            // Por usuário
            prisma.auditLog.groupBy({
                by: ['userId'],
                where: {
                    tenantId,
                    createdAt: { gte: last7d }
                },
                _count: true,
                orderBy: {
                    _count: {
                        userId: 'desc'
                    }
                },
                take: 10
            })
        ])

        return {
            total,
            last24h: last24hCount,
            last7d: last7dCount,
            byAction,
            topUsers: byUser
        }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar estatísticas')
    }
}
