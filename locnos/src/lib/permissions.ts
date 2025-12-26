import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { PermissionAction } from '@prisma/client'

/**
 * Obtém informações de autenticação do tenant atual
 * @throws Error se usuário não estiver autenticado
 */
export async function getTenantAuth(): Promise<{
    userId: string
    tenantId: string
    roleId: string | null
}> {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        throw new Error('Não autenticado')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            tenantId: true,
            roleId: true,
            status: true,
            isActive: true
        }
    })

    if (!user) {
        throw new Error('Usuário não encontrado')
    }

    if (!user.isActive || user.status === 'BLOCKED') {
        throw new Error('Usuário bloqueado')
    }

    if (!user.tenantId) {
        throw new Error('Usuário sem tenant associado')
    }

    return {
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId
    }
}

/**
 * Verifica se o usuário tem uma permissão específica
 * @param userId ID do usuário
 * @param resourceName Nome do recurso (ex: 'users', 'rentals')
 * @param action Ação a ser verificada (ex: 'VIEW', 'CREATE')
 * @returns true se o usuário tem a permissão
 */
export async function checkPermission(
    userId: string,
    resourceName: string,
    action: PermissionAction
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            return false
        }

        // 1. Verificar permissões customizadas do usuário (override)
        const userPermission = user.permissions.find(
            up => up.permission.resource.name === resourceName && up.permission.action === action
        )

        if (userPermission) {
            return userPermission.granted
        }

        // 2. Verificar permissões do role
        if (user.role) {
            const rolePermission = user.role.permissions.find(
                rp => rp.permission.resource.name === resourceName && rp.permission.action === action
            )

            if (rolePermission && rolePermission.granted) {
                return true
            }

            // 3. Verificar se o role tem permissão MANAGE no recurso (implica todas as ações)
            const managePermission = user.role.permissions.find(
                rp => rp.permission.resource.name === resourceName && rp.permission.action === 'MANAGE'
            )

            if (managePermission && managePermission.granted) {
                return true
            }
        }

        return false
    } catch (error) {
        console.error('Erro ao verificar permissão:', error)
        return false
    }
}

/**
 * Verifica se o usuário tem permissão e lança erro se não tiver
 * @param resourceName Nome do recurso
 * @param action Ação a ser verificada
 * @throws Error se o usuário não tiver permissão
 */
export async function requirePermission(
    resourceName: string,
    action: PermissionAction
): Promise<void> {
    const { userId } = await getTenantAuth()

    const hasPermission = await checkPermission(userId, resourceName, action)

    if (!hasPermission) {
        throw new Error(`Permissão negada: ${action} em ${resourceName}`)
    }
}

/**
 * Obtém todas as permissões de um usuário (role + customizadas)
 * @param userId ID do usuário
 * @returns Lista de permissões
 */
export async function getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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
        return []
    }

    const permissions = new Map<string, {
        resourceName: string
        action: PermissionAction
        granted: boolean
        source: 'role' | 'custom'
    }>()

    // 1. Adicionar permissões do role
    if (user.role) {
        user.role.permissions.forEach(rp => {
            const key = `${rp.permission.resource.name}:${rp.permission.action}`
            permissions.set(key, {
                resourceName: rp.permission.resource.name,
                action: rp.permission.action,
                granted: rp.granted,
                source: 'role'
            })
        })
    }

    // 2. Sobrescrever com permissões customizadas
    user.permissions.forEach(up => {
        const key = `${up.permission.resource.name}:${up.permission.action}`
        permissions.set(key, {
            resourceName: up.permission.resource.name,
            action: up.permission.action,
            granted: up.granted,
            source: 'custom'
        })
    })

    return Array.from(permissions.values()).filter(p => p.granted)
}

/**
 * Verifica se o usuário é administrador (tem todas as permissões)
 * @param userId ID do usuário
 * @returns true se for administrador
 */
export async function isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                select: {
                    name: true
                }
            }
        }
    })

    return user?.role?.name === 'Administrador'
}
