import { prisma } from '@/lib/prisma'
import { readWorkbook } from '@/lib/helpers/xlsx-helper'
import { resolveImportOrder } from '@/lib/helpers/fk-resolver'
import { hash } from 'bcryptjs'

export interface ImportOptions {
    tenantId: string
    mode: 'merge' | 'replace'
    resetBeforeImport?: boolean
    createNewTenant?: boolean
}

export interface ImportResult {
    success: boolean
    recordsImported: number
    tablesImported: number
    errors: string[]
    warnings: string[]
}

/**
 * Importa dados de um arquivo de backup
 */
export async function importBackupFile(
    fileBuffer: Buffer,
    options: ImportOptions
): Promise<ImportResult> {
    const { tenantId, mode, resetBeforeImport } = options

    const errors: string[] = []
    const warnings: string[] = []
    let recordsImported = 0
    let tablesImported = 0

    try {
        // Ler arquivo
        const { meta, tables } = await readWorkbook(fileBuffer)

        // Resolver ordem de importação
        const tableNames = tables.map(t => t.name)
        const importOrder = resolveImportOrder(tableNames)

        // Ordenar tabelas
        const orderedTables = importOrder
            .map(name => tables.find(t => t.name === name))
            .filter(t => t !== undefined)

        // Importar em transação
        await prisma.$transaction(async (tx) => {
            for (const table of orderedTables) {
                try {
                    console.log(`Importando tabela: ${table.name}`)

                    const count = await importTable(tx, table.name, table.rows, tenantId, mode)
                    recordsImported += count
                    tablesImported++
                } catch (error: any) {
                    const msg = `Erro ao importar ${table.name}: ${error.message}`
                    console.error(msg)
                    errors.push(msg)
                    // Não lançar erro para permitir rollback automático
                    throw error
                }
            }
        }, {
            timeout: 300000 // 5 minutos de timeout
        })

        return {
            success: errors.length === 0,
            recordsImported,
            tablesImported,
            errors,
            warnings
        }
    } catch (error: any) {
        errors.push(`Falha na importação: ${error.message}`)

        return {
            success: false,
            recordsImported,
            tablesImported,
            errors,
            warnings
        }
    }
}

/**
 * Importa dados de uma tabela
 */
async function importTable(
    tx: any,
    tableName: string,
    rows: any[],
    targetTenantId: string,
    mode: 'merge' | 'replace'
): Promise<number> {
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1)
    const model = (tx as any)[modelName]

    if (!model) {
        console.warn(`Model não encontrado: ${tableName}`)
        return 0
    }

    let count = 0

    for (const row of rows) {
        // Substituir tenantId pelo target
        const processedRow = { ...row }

        if (processedRow.tenantId) {
            processedRow.tenantId = targetTenantId
        }

        // Tratamento especial para User
        if (tableName === 'User') {
            // Gerar senha inválida
            processedRow.password = await hash('***RESET_REQUIRED***', 10)
            processedRow.status = 'PENDING'
        }

        // Tratamento especial para IntegrationConfig
        if (tableName === 'IntegrationConfig') {
            // Remover secrets mascarados
            if (processedRow.apiKey === '***MASKED***') {
                processedRow.apiKey = ''
            }
            if (processedRow.apiSecret === '***MASKED***') {
                processedRow.apiSecret = ''
            }
        }

        // Converter datas de string para Date
        if (processedRow.createdAt && typeof processedRow.createdAt === 'string') {
            processedRow.createdAt = new Date(processedRow.createdAt)
        }
        if (processedRow.updatedAt && typeof processedRow.updatedAt === 'string') {
            processedRow.updatedAt = new Date(processedRow.updatedAt)
        }

        try {
            if (mode === 'merge') {
                // UPSERT: tentar manter ID original se possível
                await model.upsert({
                    where: { id: processedRow.id },
                    create: processedRow,
                    update: processedRow
                })
            } else {
                // Create: sempre criar novo
                await model.create({
                    data: processedRow
                })
            }

            count++
        } catch (error: any) {
            console.error(`Erro ao importar registro da tabela ${tableName}:`, error.message)
            // Continuar com próximo registro
        }
    }

    return count
}
