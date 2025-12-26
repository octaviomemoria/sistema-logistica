
import { prisma } from '@/lib/prisma'

export class AssetService {
    /**
     * Generates a new unique code for an asset within a tenant.
     * Pattern: PREFIX-SEQUENCE (e.g., EQP-0001)
     */
    static async generateNextCode(tenantId: string, prefix: string = 'EQP'): Promise<string> {
        // Find last asset with this prefix to determine sequence
        // This is not perfectly race-condition proof without table locking, but suffices for now.
        const lastAsset = await prisma.asset.findFirst({
            where: {
                tenantId,
                code: { startsWith: prefix }
            },
            orderBy: { code: 'desc' }
        })

        if (!lastAsset) {
            return `${prefix}-0001`
        }

        // Extract number
        const parts = lastAsset.code.split('-')
        const lastNum = parseInt(parts[parts.length - 1])

        if (isNaN(lastNum)) return `${prefix}-${Date.now().toString().slice(-4)}`

        const nextNum = (lastNum + 1).toString().padStart(4, '0')
        return `${prefix}-${nextNum}`
    }

    static async createAsset({ equipmentId, tenantId, code, serialNumber, notes, condition }: any) {
        const finalCode = code || await this.generateNextCode(tenantId)

        return prisma.asset.create({
            data: {
                equipmentId,
                tenantId,
                code: finalCode,
                serialNumber,
                notes,
                condition,
                status: 'AVAILABLE'
            }
        })
    }
}
