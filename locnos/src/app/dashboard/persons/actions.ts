'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Prisma } from '@prisma/client'

export type PersonFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DEFAULTER'

// Helper to get current tenant
async function getTenantAuth() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: No tenant found')
    }
    return {
        tenantId: session.user.tenantId,
        userId: session.user.id
    }
}

// Get all PersonTypes
export async function getPersonTypes() {
    try {
        const { tenantId } = await getTenantAuth()

        const personTypes = await prisma.personType.findMany({
            where: {
                OR: [
                    { system: true },
                    { tenantId }
                ]
            },
            orderBy: { name: 'asc' }
        })
        return { success: true, personTypes }
    } catch (error) {
        console.error('Failed to fetch person types:', error)
        return { success: false, error: 'Failed to fetch person types' }
    }
}

// Create a new PersonType (custom type)
export async function createPersonType(name: string, color: string) {
    try {
        const { tenantId } = await getTenantAuth()

        const personType = await prisma.personType.create({
            data: {
                name,
                color,
                system: false,
                tenantId
            }
        })
        revalidatePath('/dashboard/persons')
        return { success: true, personType }
    } catch (error: any) {
        console.error('Failed to create person type:', error)
        return { success: false, error: error.message || 'Failed to create person type' }
    }
}

// Delete a PersonType (only non-system types)
export async function deletePersonType(id: string) {
    try {
        const { tenantId } = await getTenantAuth()

        // Check if it's a system type or belongs to another tenant
        const personType = await prisma.personType.findUnique({
            where: { id }
        })

        if (!personType) return { success: false, error: 'Type not found' }

        if (personType.system) {
            return { success: false, error: 'Cannot delete system types' }
        }

        if (personType.tenantId !== tenantId) {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.personType.delete({ where: { id } })
        revalidatePath('/dashboard/persons')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete person type:', error)
        return { success: false, error: 'Failed to delete person type' }
    }
}

// Assign PersonType to a Person
export async function assignPersonType(personId: string, typeId: string) {
    try {
        const { tenantId } = await getTenantAuth()

        // Verify person belongs to tenant
        const person = await prisma.person.findUnique({
            where: { id, tenantId }
        })
        if (!person) return { success: false, error: 'Person not found' }

        await prisma.personPersonType.create({
            data: {
                personId,
                personTypeId: typeId,
                tenantId
            }
        })
        revalidatePath('/dashboard/persons')
        return { success: true }
    } catch (error) {
        console.error('Failed to assign person type:', error)
        return { success: false, error: 'Failed to assign person type' }
    }
}

// Remove PersonType from a Person
export async function removePersonType(personId: string, typeId: string) {
    try {
        const { tenantId } = await getTenantAuth()

        // Verify ownership via delete where clause implicitly or explicit check
        // For safety, we check ownership of the relation if possible, or usually just rely on person ownership
        // But here we can delete by composite ID. 
        // Better to check person first.
        const person = await prisma.person.findUnique({
            where: { id: personId, tenantId }
        })
        if (!person) return { success: false, error: 'Person not found' }

        await prisma.personPersonType.delete({
            where: {
                personId_personTypeId: {
                    personId,
                    personTypeId: typeId
                }
            }
        })
        revalidatePath('/dashboard/persons')
        return { success: true }
    } catch (error) {
        console.error('Failed to remove person type:', error)
        return { success: false, error: 'Failed to remove person type' }
    }
}

// Get all Persons with their types
export async function getPersons(filter: PersonFilter = 'ALL', search?: string, typeIds?: string[]) {
    try {
        const { tenantId } = await getTenantAuth()

        const where: Prisma.PersonWhereInput = {
            tenantId
        }

        // Filter by status
        if (filter === 'ACTIVE') {
            where.active = true
            where.status = { not: 'DEFAULTER' }
        } else if (filter === 'INACTIVE') {
            where.active = false
        } else if (filter === 'DEFAULTER') {
            where.status = 'DEFAULTER'
        }

        // Filter by person types
        if (typeIds && typeIds.length > 0) {
            where.personTypes = {
                some: {
                    personTypeId: { in: typeIds }
                }
            }
        }

        // Search text
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { tradeName: { contains: search, mode: 'insensitive' } },
                { document: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        const persons = await prisma.person.findMany({
            where,
            include: {
                personTypes: {
                    include: {
                        personType: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, persons }
    } catch (error) {
        console.error('Failed to fetch persons:', error)
        return { success: false, error: 'Failed to fetch persons' }
    }
}

export async function createPerson(data: any) {
    try {
        const { tenantId, userId } = await getTenantAuth()

        // Validate unique document WITHIN TENANT
        const existing = await prisma.person.findFirst({
            where: {
                document: data.document,
                tenantId
            }
        })

        if (existing) {
            return { success: false, error: 'Documento (CPF/CNPJ) já cadastrado nesta empresa' }
        }

        // Extract personTypeIds from data
        const { personTypeIds, ...personData } = data

        const person = await prisma.person.create({
            data: {
                ...personData,
                status: 'ACTIVE',
                active: true,
                tenantId,
                createdById: userId,
                personTypes: personTypeIds && personTypeIds.length > 0 ? {
                    create: personTypeIds.map((typeId: string) => ({
                        personTypeId: typeId,
                        tenantId
                    }))
                } : undefined
            },
            include: {
                personTypes: {
                    include: {
                        personType: true
                    }
                }
            }
        })

        // TODO: Create Audit Log here
        // await createAuditLog({ action: 'CREATE', entity: 'Person', entityId: person.id, ... })

        revalidatePath('/dashboard/persons')
        return { success: true, person }
    } catch (error: any) {
        console.error('Failed to create person:', error)
        return { success: false, error: error.message || 'Failed to create person' }
    }
}

export async function updatePerson(id: string, data: any) {
    try {
        const { tenantId } = await getTenantAuth()

        // Verify existence and ownership
        const existing = await prisma.person.findUnique({
            where: { id, tenantId }
        })
        if (!existing) return { success: false, error: 'Person not found' }

        // Extract personTypeIds from data
        const { personTypeIds, ...personData } = data

        // If personTypeIds is provided, update the associations
        if (personTypeIds !== undefined) {
            // Delete all existing associations
            await prisma.personPersonType.deleteMany({
                where: { personId: id } // We could verify tenantId implicitly via Person logic, but relations don't necessarily have tenantId filter in deleteMany unless we store it. We DO store it now.
            })

            // Create new associations
            if (personTypeIds.length > 0) {
                await prisma.personPersonType.createMany({
                    data: personTypeIds.map((typeId: string) => ({
                        personId: id,
                        personTypeId: typeId,
                        tenantId
                    }))
                })
            }
        }

        const person = await prisma.person.update({
            where: { id },
            data: personData,
            include: {
                personTypes: {
                    include: {
                        personType: true
                    }
                }
            }
        })

        revalidatePath('/dashboard/persons')
        return { success: true, person }
    } catch (error) {
        console.error('Failed to update person:', error)
        return { success: false, error: 'Failed to update person' }
    }
}

export async function togglePersonStatus(id: string, active: boolean) {
    try {
        const { tenantId } = await getTenantAuth()

        // Verify ownership
        const existing = await prisma.person.findUnique({ where: { id, tenantId } })
        if (!existing) return { success: false, error: 'Person not found' }

        await prisma.person.update({
            where: { id },
            data: {
                active,
                status: active ? 'ACTIVE' : 'INACTIVE'
            }
        })

        revalidatePath('/dashboard/persons')
        return { success: true }
    } catch (error) {
        console.error('Failed to toggle person status:', error)
        return { success: false, error: 'Failed to toggle status' }
    }
}

export async function setAsDefaulter(id: string, isDefaulter: boolean) {
    try {
        const { tenantId } = await getTenantAuth()

        const existing = await prisma.person.findUnique({ where: { id, tenantId } })
        if (!existing) return { success: false, error: 'Person not found' }

        await prisma.person.update({
            where: { id },
            data: {
                status: isDefaulter ? 'DEFAULTER' : 'ACTIVE'
            }
        })

        revalidatePath('/dashboard/persons')
        return { success: true }
    } catch (error) {
        console.error('Failed to update defaulter status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function getPersonById(id: string) {
    try {
        const { tenantId } = await getTenantAuth()

        const person = await prisma.person.findUnique({
            where: { id, tenantId },
            include: {
                personTypes: {
                    include: {
                        personType: true
                    }
                }
            }
        })
        return { success: true, person }
    } catch (error) {
        console.error('Failed to fetch person:', error)
        return { success: false, error: 'Failed to fetch person' }
    }
}
