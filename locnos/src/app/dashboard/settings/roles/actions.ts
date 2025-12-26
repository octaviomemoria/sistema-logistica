'use server'

import { prisma } from '@/lib/prisma'
import { getTenantAuth, requirePermission } from '@/lib/permissions'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// ========== SCHEMAS DE VALIDAÇÃO ==========

const CreateRoleSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional()
})

const UpdateRoleSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional()
})

// ========== TYPES ==========

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>

// ========== CRUD ACTIONS ==========

/**
 * Lista todos os perfis do tenant
 */
export async function getRoles() {
    try {
        await requirePermission('roles', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const roles = await prisma.role.findMany({
            where: {
                tenantId
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        permissions: true
                    }
                }
            },
            orderBy: [
                { isSystem: 'desc' }, // System roles first
                { name: 'asc' }
            ]
        })

        return roles
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar perfis')
    }
}

/**
 * Busca um perfil por ID
 */
export async function getRoleById(id: string) {
    try {
        await requirePermission('roles', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const role = await prisma.role.findFirst({
            where: {
                id,
                tenantId
            },
            include: {
                permissions: {
                    include: {
                        permission: {
                            include: {
                                resource: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        })

        if (!role) {
            throw new Error('Perfil não encontrado')
        }

        return role
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar perfil')
    }
}

/**
 * Cria um novo perfil
 */
export async function createRole(data: CreateRoleInput) {
    try {
        await requirePermission('roles', 'CREATE')
        const { tenantId } = await getTenantAuth()

        // Validar dados
        const validated = CreateRoleSchema.parse(data)

        // Verificar se já existe perfil com mesmo nome no tenant
        const existingRole = await prisma.role.findFirst({
            where: {
                name: validated.name,
                tenantId
            }
        })

        if (existingRole) {
            throw new Error('Já existe um perfil com este nome')
        }

        // Criar role
        const role = await prisma.role.create({
            data: {
                name: validated.name,
                description: validated.description,
                isSystem: false,
                tenantId
            }
        })

        revalidatePath('/dashboard/settings/roles')

        return role
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
        }
        throw new Error(error.message || 'Erro ao criar perfil')
    }
}

/**
 * Atualiza um perfil existente
 */
export async function updateRole(id: string, data: UpdateRoleInput) {
    try {
        await requirePermission('roles', 'EDIT')
        const { tenantId } = await getTenantAuth()

        // Validar dados
        const validated = UpdateRoleSchema.parse(data)

        // Verificar ownership e se não é system
        const existingRole = await prisma.role.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!existingRole) {
            throw new Error('Perfil não encontrado')
        }

        if (existingRole.isSystem) {
            throw new Error('Perfis do sistema não podem ser editados')
        }

        // Se está alterando nome, verificar duplicidade
        if (validated.name) {
            const duplicateRole = await prisma.role.findFirst({
                where: {
                    name: validated.name,
                    tenantId,
                    id: {
                        not: id
                    }
                }
            })

            if (duplicateRole) {
                throw new Error('Já existe um perfil com este nome')
            }
        }

        // Atualizar
        const role = await prisma.role.update({
            where: { id },
            data: validated
        })

        revalidatePath('/dashboard/settings/roles')

        return role
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
        }
        throw new Error(error.message || 'Erro ao atualizar perfil')
    }
}

/**
 * Deleta um perfil (se não for system e não tiver usuários)
 */
export async function deleteRole(id: string) {
    try {
        await requirePermission('roles', 'DELETE')
        const { tenantId } = await getTenantAuth()

        const role = await prisma.role.findFirst({
            where: {
                id,
                tenantId
            },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        })

        if (!role) {
            throw new Error('Perfil não encontrado')
        }

        if (role.isSystem) {
            throw new Error('Perfis do sistema não podem ser deletados')
        }

        if (role._count.users > 0) {
            throw new Error(`Não é possível deletar: existem ${role._count.users} usuário(s) com este perfil`)
        }

        // Deletar permissões relacionadas e role
        await prisma.rolePermission.deleteMany({
            where: { roleId: id }
        })

        await prisma.role.delete({
            where: { id }
        })

        revalidatePath('/dashboard/settings/roles')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao deletar perfil')
    }
}

/**
 * Busca todas as permissões de um perfil
 */
export async function getRolePermissions(roleId: string) {
    try {
        await requirePermission('roles', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                tenantId
            }
        })

        if (!role) {
            throw new Error('Perfil não encontrado')
        }

        const permissions = await prisma.rolePermission.findMany({
            where: { roleId },
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
        throw new Error(error.message || 'Erro ao buscar permissões do perfil')
    }
}

/**
 * Atualiza as permissões de um perfil
 */
export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
    try {
        await requirePermission('roles', 'MANAGE')
        const { tenantId } = await getTenantAuth()

        const role = await prisma.role.findFirst({
            where: {
                id: roleId,
                tenantId
            }
        })

        if (!role) {
            throw new Error('Perfil não encontrado')
        }

        if (role.isSystem) {
            throw new Error('Permissões de perfis do sistema não podem ser alteradas')
        }

        // Deletar permissões existentes
        await prisma.rolePermission.deleteMany({
            where: { roleId }
        })

        // Criar novas permissões
        if (permissionIds.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissionIds.map(permissionId => ({
                    roleId,
                    permissionId,
                    granted: true
                }))
            })
        }

        revalidatePath('/dashboard/settings/roles')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao atualizar permissões')
    }
}
