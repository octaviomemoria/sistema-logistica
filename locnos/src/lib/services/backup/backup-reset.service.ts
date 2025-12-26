import { prisma } from '@/lib/prisma'
import { resolveDeleteOrder } from '@/lib/helpers/fk-resolver'

export interface ResetOptions {
    tenantId: string
    modules?: string[] // Módulos específicos para resetar
    excludeCurrentUser?: boolean
    currentUserId?: string
}

export interface ResetResult {
    success: boolean
    deletedRecords: number
    deletedTables: number
    errors: string[]
}

/**
 * Reseta (limpa) dados do tenant
 * CUIDADO: Operação destrutiva!
 */
export async function resetTenantData(options: ResetOptions): Promise<ResetResult> {
    const { tenantId, modules, currentUserId } = options

    const errors: string[] = []
    let deletedRecords = 0
    let deletedTables = 0

    try {
        // Determinar quais tabelas resetar
        const tablesToReset = modules ? getTablesByModules(modules) : getAllDeleteableTables()

        // Resolver ordem de deleção (filhos antes de pais)
        const deleteOrder = resolveDeleteOrder(tablesToReset)

        console.log(`Resetando ${tablesToReset.length} tabelas do tenant ${tenantId}`)

        // Deletar em transação
        await prisma.$transaction(async (tx) => {
            for (const tableName of deleteOrder) {
                try {
                    console.log(`Limpando tabela: ${tableName}`)

                    const count = await deleteTableData(tx, tableName, tenantId, currentUserId)

                    if (count > 0) {
                        deletedRecords += count
                        deletedTables++
                        console.log(`  → ${count} registros deletados`)
                    }
                } catch (error: any) {
                    const msg = `Erro ao limpar ${tableName}: ${error.message}`
                    console.error(msg)
                    errors.push(msg)
                    throw error // Forçar rollback
                }
            }
        }, {
            timeout: 300000 // 5 minutos
        })

        return {
            success: errors.length === 0,
            deletedRecords,
            deletedTables,
            errors
        }
    } catch (error: any) {
        errors.push(`Falha ao resetar tenant: ${error.message}`)

        return {
            success: false,
            deletedRecords,
            deletedTables,
            errors
        }
    }
}

/**
 * Deleta dados de uma tabela específica do tenant
 */
async function deleteTableData(
    tx: any,
    tableName: string,
    tenantId: string,
    currentUserId?: string
): Promise<number> {
    const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1)
    const model = (tx as any)[modelName]

    if (!model) {
        console.warn(`Model não encontrado: ${tableName}`)
        return 0
    }

    const where: any = { tenantId }

    // Proteção: não deletar usuário atual
    if (tableName === 'User' && currentUserId) {
        where.NOT = { id: currentUserId }
    }

    try {
        const result = await model.deleteMany({ where })
        return result.count || 0
    } catch (error: any) {
        console.error(`Erro ao deletar ${tableName}:`, error.message)
        return 0
    }
}

/**
 * Retorna todas as tabelas que podem ser deletadas
 */
function getAllDeleteableTables(): string[] {
    return [
        // Dados transacionais (ordem inversa de import)
        'BankStatementItem',
        'FinancialMovement',
        'FinancialTitle',
        'Payment',
        'RentalOccurrence',
        'RentalItem',
        'Rental',
        'RouteStop',
        'Route',
        'Subtask',
        'Task',
        'InventoryMovement',
        'Asset',
        'Maintenance',
        'Equipment',
        'PersonPersonType',
        'Person',
        'PersonType',
        'ContractTemplate',
        'IntegrationLog',
        'AuditLog',
        'IntegrationConfig',
        'BankAccount',
        'CostCenter',
        'ChartOfAccount',
        'UserPermission',
        'RolePermission',
        'User',
        'Role',
    ]
}

/**
 * Retorna tabelas por módulo
 */
function getTablesByModules(modules: string[]): string[] {
    const moduleMap: Record<string, string[]> = {
        'persons': ['PersonPersonType', 'Person', 'PersonType'],
        'inventory': ['Asset', 'Equipment', 'InventoryMovement'],
        'maintenance': ['Maintenance'],
        'rentals': ['Payment', 'RentalOccurrence', 'RentalItem', 'Rental'],
        'routes': ['RouteStop', 'Route'],
        'tasks': ['Subtask', 'Task'],
        'financial': [
            'BankStatementItem',
            'FinancialMovement',
            'FinancialTitle',
            'IntegrationConfig',
            'BankAccount',
            'CostCenter',
            'ChartOfAccount'
        ],
        'users': ['UserPermission', 'User', 'Role', 'RolePermission'],
        'templates': ['ContractTemplate'],
        'logs': ['AuditLog', 'IntegrationLog'],
    }

    const tables: string[] = []

    for (const module of modules) {
        const moduleTables = moduleMap[module] || []
        tables.push(...moduleTables)
    }

    return [...new Set(tables)] // Remove duplicatas
}
