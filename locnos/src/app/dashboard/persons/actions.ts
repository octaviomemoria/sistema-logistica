'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export type PersonFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DEFAULTER'

// Get all PersonTypes
export async function getPersonTypes() {
    try {
        const personTypes = await prisma.personType.findMany({
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
        const personType = await prisma.personType.create({
            data: {
                name,
                color,
                system: false // Custom types are never system types
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
        // Check if it's a system type
        const personType = await prisma.personType.findUnique({ where: { id } })
        if (personType?.system) {
            return { success: false, error: 'Cannot delete system types' }
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
        await prisma.personPersonType.create({
            data: {
                personId,
                personTypeId: typeId
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
        const where: any = {}

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
        // Validate unique document
        const existing = await prisma.person.findUnique({
            where: { document: data.document }
        })

        if (existing) {
            return { success: false, error: 'Documento (CPF/CNPJ) já cadastrado' }
        }

        // Extract personTypeIds from data
        const { personTypeIds, ...personData } = data

        const person = await prisma.person.create({
            data: {
                ...personData,
                status: 'ACTIVE',
                active: true,
                personTypes: personTypeIds && personTypeIds.length > 0 ? {
                    create: personTypeIds.map((typeId: string) => ({
                        personTypeId: typeId
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

        revalidatePath('/dashboard/persons')
        return { success: true, person }
    } catch (error: any) {
        console.error('Failed to create person:', error)
        return { success: false, error: error.message || 'Failed to create person' }
    }
}

export async function updatePerson(id: string, data: any) {
    try {
        // Extract personTypeIds from data
        const { personTypeIds, ...personData } = data

        // If personTypeIds is provided, update the associations
        if (personTypeIds !== undefined) {
            // Delete all existing associations
            await prisma.personPersonType.deleteMany({
                where: { personId: id }
            })

            // Create new associations
            if (personTypeIds.length > 0) {
                await prisma.personPersonType.createMany({
                    data: personTypeIds.map((typeId: string) => ({
                        personId: id,
                        personTypeId: typeId
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
        const person = await prisma.person.findUnique({
            where: { id },
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
