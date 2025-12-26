'use server'

import { prisma } from '@/lib/prisma'
import { getTenantAuth, requirePermission } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

// ========== RESOURCE & PERMISSION ACTIONS ==========

/**
 * Lista todos os recursos do sistema
 */
export async function getResources() {
    try {
        await requirePermission('roles', 'VIEW')

        const resources = await prisma.resource.findMany({
            where: {
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        permissions: true
                    }
                }
            },
            orderBy: [
                { module: 'asc' },
                { displayName: 'asc' }
            ]
        })

        return resources
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar recursos')
    }
}

/**
 * Lista permissões de um recurso específico
 */
export async function getPermissionsByResource(resourceId: string) {
    try {
        await requirePermission('roles', 'VIEW')

        const permissions = await prisma.permission.findMany({
            where: {
                resourceId
            },
            include: {
                resource: true
            },
            orderBy: {
                action: 'asc'
            }
        })

        return permissions
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar permissões')
    }
}

/**
 * Lista todas as permissões do sistema
 */
export async function getAllPermissions() {
    try {
        await requirePermission('roles', 'VIEW')

        const permissions = await prisma.permission.findMany({
            include: {
                resource: true
            },
            orderBy: [
                { resource: { module: 'asc' } },
                { resource: { displayName: 'asc' } },
                { action: 'asc' }
            ]
        })

        return permissions
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar permissões')
    }
}

/**
 * Busca permissões customizadas de um usuário
 */
export async function getUserCustomPermissions(userId: string) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        // Verificar se usuário pertence ao tenant
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        const permissions = await prisma.userPermission.findMany({
            where: { userId },
            include: {
                permission: {
                    include: {
                        resource: true
                    }
                }
            }
        })

        return permissions
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar permissões customizadas')
    }
}

/**
 * Atualiza permissões customizadas de um usuário
 */
export async function updateUserPermissions(
    userId: string,
    permissions: { permissionId: string; granted: boolean }[]
) {
    try {
        await requirePermission('users', 'MANAGE')
        const { tenantId } = await getTenantAuth()

        // Verificar ownership
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        // Deletar permissões customizadas existentes
        await prisma.userPermission.deleteMany({
            where: { userId }
        })

        // Criar novas permissões customizadas
        if (permissions.length > 0) {
            await prisma.userPermission.createMany({
                data: permissions.map(p => ({
                    userId,
                    permissionId: p.permissionId,
                    granted: p.granted
                }))
            })
        }

        revalidatePath('/dashboard/settings/users')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao atualizar permissões customizadas')
    }
}

/**
 * Busca permissões efetivas de um usuário (role + custom)
 */
export async function getUserEffectivePermissions(userId: string) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: {
                                    include: {
                                        resource: true
                                    }
                                }
                            }
                        }
                    }
                },
                permissions: {
                    include: {
                        permission: {
                            include: {
                                resource: true
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        // Combinar permissões do role e customizadas
        const effectivePermissions = new Map<string, {
            permissionId: string
            resourceName: string
            resourceDisplayName: string
            action: string
            granted: boolean
            source: 'role' | 'custom'
        }>()

        // 1. Adicionar permissões do role
        if (user.role) {
            user.role.permissions.forEach(rp => {
                const key = rp.permissionId
                effectivePermissions.set(key, {
                    permissionId: rp.permission.id,
                    resourceName: rp.permission.resource.name,
                    resourceDisplayName: rp.permission.resource.displayName,
                    action: rp.permission.action,
                    granted: rp.granted,
                    source: 'role'
                })
            })
        }

        // 2. Sobrescrever com permissões customizadas
        user.permissions.forEach(up => {
            const key = up.permissionId
            effectivePermissions.set(key, {
                permissionId: up.permission.id,
                resourceName: up.permission.resource.name,
                resourceDisplayName: up.permission.resource.displayName,
                action: up.permission.action,
                granted: up.granted,
                source: 'custom'
            })
        })

        return Array.from(effectivePermissions.values())
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar permissões efetivas')
    }
}
