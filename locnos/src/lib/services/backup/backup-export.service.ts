import { prisma } from '@/lib/prisma'
import { createWorkbook } from '@/lib/helpers/xlsx-helper'
import { createZipArchive } from '@/lib/helpers/csv-zip-helper'
import { generateBackupMeta, maskSensitiveData, isMultiTenantTable } from './backup-meta.service'
import path from 'path'
import fs from 'fs/promises'

export interface ExportOptions {
    tenantId: string
    format: 'XLSX' | 'CSV_ZIP'
    tables?: string[]
    includeSecrets?: boolean
    includeLogs?: boolean
}

const CHUNK_SIZE = 5000 // Processar 5k linhas por vez

/**
 * Exporta dados do tenant para arquivo de backup
 */
export async function exportTenantData(options: ExportOptions): Promise<{
    filePath: string
    fileName: string
    fileSize: number
    meta: any
}> {
    const { tenantId, format, tables, includeSecrets, includeLogs } = options

    // Gerar metadados
    const meta = await generateBackupMeta(tenantId, format, {
        includeSecrets,
        includeLogs,
        selectedTables: tables
    })

    // Exportar dados de cada tabela
    const tableDataList = []

    for (const tableName of meta.includedTables) {
        console.log(`Exportando tabela: ${tableName}`)

        try {
            const data = await exportTable(tableName, tenantId, includeSecrets || false)

            if (data.length > 0) {
                tableDataList.push({
                    name: tableName,
                    rows: data
                })
            }
        } catch (error: any) {
            console.error(`Erro ao exportar ${tableName}:`, error.message)
            // Continuar com as outras tabelas
        }
    }

    // Gerar arquivo
    let buffer: Buffer
    let extension: string

    if (format === 'XLSX') {
        buffer = await createWorkbook(meta, tableDataList)
        extension = 'xlsx'
    } else {
        buffer = await createZipArchive(meta, tableDataList)
        extension = 'zip'
    }

    // Salvar arquivo
    const fileName = `backup-${meta.tenantName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${extension}`
    const backupDir = path.join(process.cwd(), 'tmp', 'backups')

    // Criar diretório se não existir
    await fs.mkdir(backupDir, { recursive: true })

    const filePath = path.join(backupDir, fileName)
    await fs.writeFile(filePath, buffer)

    const stats = await fs.stat(filePath)

    return {
        filePath,
        fileName,
        fileSize: stats.size,
        meta
    }
}

/**
 * Exporta dados de uma tabela específica
 */
async function exportTable(tableName: string, tenantId: string, includeSecrets: boolean): Promise<any[]> {
    // Obter o model do Prisma dinamicamente
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)]

    if (!model) {
        console.warn(`Model não encontrado para tabela: ${tableName}`)
        return []
    }

    // Construir where clause
    const where: any = {}

    // Se a tabela tem tenantId, filtrar por tenant
    if (isMultiTenantTable(tableName)) {
        where.tenantId = tenantId
    }

    // Buscar dados em chunks
    const allData: any[] = []
    let skip = 0
    let hasMore = true

    while (hasMore) {
        const chunk = await model.findMany({
            where,
            skip,
            take: CHUNK_SIZE,
            orderBy: { createdAt: 'asc' }
        })

        if (chunk.length === 0) {
            hasMore = false
        } else {
            // Processar e mascarar dados sensíveis
            const processedChunk = chunk.map((row: any) => {
                return maskSensitiveData(tableName, row, includeSecrets)
            })

            allData.push(...processedChunk)
            skip += CHUNK_SIZE
        }
    }

    return allData
}

/**
 * Atualiza progresso de um job
 */
export async function updateJobProgress(jobId: string, progress: number, status?: string): Promise<void> {
    const updateData: any = { progress }

    if (status) {
        updateData.status = status
    }

    if (progress === 100 && status === 'DONE') {
        updateData.finishedAt = new Date()
    }

    await prisma.backupJob.update({
        where: { id: jobId },
        data: updateData
    })
}
