'use server'

import { prisma } from '@/lib/prisma'
import { getTenantAuth, requirePermission } from '@/lib/permissions'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { UserStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// ========== SCHEMAS DE VALIDAÇÃO ==========

const CreateUserSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    phone: z.string().optional(),
    roleId: z.string().min(1, 'Perfil é obrigatório'),
    status: z.enum(['PENDING', 'ACTIVE']).default('PENDING')
})

const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    roleId: z.string().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
    isActive: z.boolean().optional()
})

const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

// ========== TYPES ==========

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export interface UserFilters {
    status?: UserStatus
    roleId?: string
    search?: string
}

// ========== HELPERS ==========

/**
 * Gera uma senha temporária aleatória
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

// ========== CRUD ACTIONS ==========

/**
 * Lista usuários do tenant com filtros
 */
export async function getUsers(filters?: UserFilters) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const where: Prisma.UserWhereInput = {
            tenantId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        if (filters?.roleId) {
            where.roleId = filters.roleId
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ]
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Remover password do retorno
        return users.map(({ password, ...user }) => user)
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar usuários')
    }
}

/**
 * Busca um usuário por ID
 */
export async function getUserById(id: string) {
    try {
        await requirePermission('users', 'VIEW')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar usuário')
    }
}

/**
 * Cria um novo usuário
 */
export async function createUser(data: CreateUserInput) {
    try {
        await requirePermission('users', 'CREATE')
        const { tenantId } = await getTenantAuth()

        // Validar dados
        const validated = CreateUserSchema.parse(data)

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email: validated.email }
        })

        if (existingUser) {
            throw new Error('Email já cadastrado')
        }

        // Verificar se role pertence ao tenant
        const role = await prisma.role.findFirst({
            where: {
                id: validated.roleId,
                tenantId
            }
        })

        if (!role) {
            throw new Error('Perfil inválido')
        }

        // Gerar senha temporária
        const tempPassword = generateTempPassword()
        const hashedPassword = await hash(tempPassword, 10)

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email: validated.email,
                name: validated.name,
                phone: validated.phone,
                password: hashedPassword,
                roleId: validated.roleId,
                status: validated.status,
                isActive: validated.status === 'ACTIVE',
                tenantId
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        revalidatePath('/dashboard/settings/users')

        const { password, ...userWithoutPassword } = user
        return {
            user: userWithoutPassword,
            tempPassword
        }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
        }
        throw new Error(error.message || 'Erro ao criar usuário')
    }
}

/**
 * Atualiza um usuário existente
 */
export async function updateUser(id: string, data: UpdateUserInput) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        // Validar dados
        const validated = UpdateUserSchema.parse(data)

        // Verificar ownership
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!existingUser) {
            throw new Error('Usuário não encontrado')
        }

        // Se está alterando role, verificar se pertence ao tenant
        if (validated.roleId) {
            const role = await prisma.role.findFirst({
                where: {
                    id: validated.roleId,
                    tenantId
                }
            })

            if (!role) {
                throw new Error('Perfil inválido')
            }
        }

        // Atualizar
        const user = await prisma.user.update({
            where: { id },
            data: validated,
            include: {
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        revalidatePath('/dashboard/settings/users')

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
        }
        throw new Error(error.message || 'Erro ao atualizar usuário')
    }
}

/**
 * Ativa ou desativa um usuário
 */
export async function toggleUserStatus(id: string, isActive: boolean) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await prisma.user.update({
            where: { id },
            data: {
                isActive,
                status: isActive ? 'ACTIVE' : 'INACTIVE'
            }
        })

        revalidatePath('/dashboard/settings/users')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao alterar status')
    }
}

/**
 * Bloqueia um usuário por segurança
 */
export async function blockUser(id: string, reason: string) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await prisma.user.update({
            where: { id },
            data: {
                status: 'BLOCKED',
                isActive: false,
                blockedAt: new Date(),
                blockedReason: reason
            }
        })

        revalidatePath('/dashboard/settings/users')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao bloquear usuário')
    }
}

/**
 * Desbloqueia um usuário
 */
export async function unblockUser(id: string) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        await prisma.user.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                isActive: true,
                blockedAt: null,
                blockedReason: null,
                failedLoginCount: 0
            }
        })

        revalidatePath('/dashboard/settings/users')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao desbloquear usuário')
    }
}

/**
 * Reset de senha - gera nova senha temporária
 */
export async function resetPassword(id: string) {
    try {
        await requirePermission('users', 'EDIT')
        const { tenantId } = await getTenantAuth()

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        const tempPassword = generateTempPassword()
        const hashedPassword = await hash(tempPassword, 10)

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                failedLoginCount: 0
            }
        })

        return { tempPassword }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao resetar senha')
    }
}

/**
 * Troca de senha do próprio usuário
 */
export async function changePassword(oldPassword: string, newPassword: string) {
    try {
        const { userId } = await getTenantAuth()

        // Validar
        const validated = ChangePasswordSchema.parse({ oldPassword, newPassword })

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        // Verificar senha antiga
        const { compare } = await import('bcryptjs')
        const isValid = await compare(validated.oldPassword, user.password)

        if (!isValid) {
            throw new Error('Senha atual incorreta')
        }

        // Atualizar senha
        const hashedPassword = await hash(validated.newPassword, 10)

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        })

        return { success: true }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message)
        }
        throw new Error(error.message || 'Erro ao trocar senha')
    }
}

/**
 * Deleta um usuário (soft delete - apenas inativa)
 */
export async function deleteUser(id: string) {
    try {
        await requirePermission('users', 'DELETE')
        const { tenantId, userId } = await getTenantAuth()

        // Não pode deletar a si mesmo
        if (id === userId) {
            throw new Error('Você não pode deletar seu próprio usuário')
        }

        const user = await prisma.user.findFirst({
            where: {
                id,
                tenantId
            }
        })

        if (!user) {
            throw new Error('Usuário não encontrado')
        }

        // Soft delete
        await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                status: 'INACTIVE'
            }
        })

        revalidatePath('/dashboard/settings/users')

        return { success: true }
    } catch (error: any) {
        throw new Error(error.message || 'Erro ao deletar usuário')
    }
}
