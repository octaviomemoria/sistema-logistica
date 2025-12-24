'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface TemplateInput {
    name: string
    content: string
    active?: boolean
}

export async function getTemplates() {
    try {
        const templates = await prisma.contractTemplate.findMany({
            orderBy: { name: 'asc' }
        })
        return { success: true, templates }
    } catch (error) {
        return { success: false, error: 'Failed to fetch templates' }
    }
}

export async function createTemplate(data: TemplateInput) {
    try {
        await prisma.contractTemplate.create({ data })
        revalidatePath('/dashboard/contracts/templates')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTemplate(id: string, data: TemplateInput) {
    try {
        await prisma.contractTemplate.update({
            where: { id },
            data
        })
        revalidatePath('/dashboard/contracts/templates')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteTemplate(id: string) {
    try {
        await prisma.contractTemplate.delete({ where: { id } })
        revalidatePath('/dashboard/contracts/templates')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
