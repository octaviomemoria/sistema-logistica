'use server'

import { prisma } from '@/lib/prisma'
import { getTenantAuth, requirePermission } from '@/lib/permissions'

// ========== LOGIN ATTEMPT TRACKING ==========

/**
 * Registra uma tentativa de login
 */
export async function registerLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
) {
    try {
        // Buscar usuário e tenant pelo email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                tenantId: true,
                failedLoginCount: true
            }
        })

        // Criar registro de tentativa
        await prisma.loginAttempt.create({
            data: {
                email,
                userId: user?.id,
                success,
                ipAddress,
                userAgent,
                reason,
                tenantId: user?.tenantId
            }
        })

        // Se falhou, incrementar contador
        if (!success && user) {
            const newCount = user.failedLoginCount + 1

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: newCount
                }
            })

            // Bloquear automaticamente após 5 tentativas
            if (newCount >= 5) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: 'BLOCKED',
                        isActive: false,
                        blockedAt: new Date(),
                        blockedReason: 'Bloqueado automaticamente após 5 tentativas falhas de login'
                    }
                })
            }
        }

        // Se sucesso, limpar contador
        if (success && user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginCount: 0,
                    lastLoginAt: new Date(),
                    lastLoginIp: ipAddress
                }
            })
        }

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao registrar tentativa de login:', error)
        // Não lançar erro para não quebrar o fluxo de login
        return { success: false }
    }
}

/**
 * Verifica se um usuário estar bloqueado
 */
export async function checkUserBlocked(email: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                status: true,
                isActive: true
            }
        })

        if (!user) {
            return false
        }

        return user.status === 'BLOCKED' || !user.isActive
    } catch (error) {
        console.error('Erro ao verificar bloqueio:', error)
        return false
    }
}

/**
 * Limpa tentativas falhas de login de um usuário
 */
export async function clearLoginAttempts(userId: string) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginCount: 0
            }
        })

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao limpar tentativas')
    }
}

/**
 * Busca histórico de tentativas de login
 */
export async function getLoginAttempts(filters?: {
    userId?: string
    email?: string
    success?: boolean
    startDate?: Date
    endDate?: Date
}) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const where: any = {
            tenantId
        }

        if (filters?.userId) {
            where.userId = filters.userId
        }

        if (filters?.email) {
            where.email = filters.email
        }

        if (filters?.success !== undefined) {
            where.success = filters.success
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

        const attempts = await prisma.loginAttempt.findMany({
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
            take: 100 // Limitar a 100 registros mais recentes
        })

        return attempts
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar tentativas de login')
    }
}

// ========== SESSION MANAGEMENT ==========

/**
 * Cria uma nova sessão de usuário
 */
export async function createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 8) // 8 horas de expiração

        const session = await prisma.userSession.create({
            data: {
                userId,
                token,
                ipAddress,
                userAgent,
                expiresAt
            }
        })

        return session
    } catch (error: any) {
        console.error('Erro ao criar sessão:', error)
        throw new Error('Erro ao criar sessão')
    }
}

/**
 * Busca sessões ativas de um usuário
 */
export async function getActiveSessions(userId?: string) {
    try {
        await requirePermission('users', 'VIEW')
        const { userId: currentUserId, tenantId } = await getTenantAuth()

        // Se não especificou userId, buscar do usuário atual
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

        const sessions = await prisma.userSession.findMany({
            where: {
                userId: targetUserId,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                lastActivityAt: 'desc'
            }
        })

        return sessions
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar sessões')
    }
}

/**
 * Encerra uma sessão específica
 */
export async function terminateSession(sessionId: string) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        // Verificar ownership da sessão
        const session = await prisma.userSession.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: {
                        tenantId: true
                    }
                }
            }
        })

        if (!session) {
            throw new Error('Sessão não encontrada')
        }

        if (session.user.tenantId !== tenantId) {
            throw new Error('Permissão negada')
        }

        await prisma.userSession.delete({
            where: { id: sessionId }
        })

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao encerrar sessão')
    }
}

/**
 * Limpa sessões expiradas (job de manutenção)
 */
export async function cleanExpiredSessions() {
    try {
        const result = await prisma.userSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        })

        return { deleted: result.count }
    } catch (error: any) {
        console.error('Erro ao limpar sessões:', error)
        throw new Error('Erro ao limpar sessões expiradas')
    }
}
