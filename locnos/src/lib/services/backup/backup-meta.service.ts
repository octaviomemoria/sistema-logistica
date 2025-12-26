import { prisma } from '@/lib/prisma'
import { BackupMeta } from '../helpers/xlsx-helper'
import { getMultiTenantTables } from '../helpers/fk-resolver'

/**
 * Tabelas que são exportadas por padrão
 */
export const DEFAULT_EXPORT_TABLES = [
    // Core
    'User',
    'Role',
    'RolePermission',
    'UserPermission',

    // Persons
    'PersonType',
    'Person',
    'PersonPersonType',

    // Inventory
    'Equipment',
    'Asset',
    'InventoryMovement',

    // Maintenance
    'Maintenance',

    // Rentals & Logistics
    'Rental',
    'RentalItem',
    'RentalOccurrence',
    'Payment',
    'Route',
    'RouteStop',

    // Tasks
    'Task',
    'Subtask',

    // Financial
    'ChartOfAccount',
    'CostCenter',
    'BankAccount',
    'IntegrationConfig',
    'FinancialTitle',
    'FinancialMovement',
    'BankStatementItem',

    // Templates
    'ContractTemplate',
]

/**
 * Tabelas opcionais (logs pesados)
 */
export const OPTIONAL_LOG_TABLES = [
    'AuditLog',
    'IntegrationLog',
]

/**
 * Tabelas que NUNCA são exportadas
 */
export const EXCLUDED_TABLES = [
    'UserSession',
    'LoginAttempt',
    'Resource',
    'Permission',
    'BackupJob',
    'Tenant', // Exportado apenas o tenant atual, não todos
]

/**
 * Gera metadados de backup
 */
export async function generateBackupMeta(
    tenantId: string,
    format: 'XLSX' | 'CSV_ZIP',
    options: {
        includeSecrets?: boolean
        includeLogs?: boolean
        selectedTables?: string[]
    }
): Promise<BackupMeta> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true }
    })

    if (!tenant) {
        throw new Error('Tenant não encontrado')
    }

    const includedTables = options.selectedTables || [
        ...DEFAULT_EXPORT_TABLES,
        ...(options.includeLogs ? OPTIONAL_LOG_TABLES : [])
    ]

    return {
        systemVersion: '1.0.0',
        schemaVersion: '2025-12-26',
        exportedAt: new Date().toISOString(),
        tenantId,
        tenantName: tenant.name,
        format,
        includedTables,
        includeSecrets: options.includeSecrets || false,
        includeLogs: options.includeLogs || false
    }
}

/**
 * Valida se o backup é compatível com o sistema atual
 */
export function validateBackupCompatibility(meta: BackupMeta): {
    compatible: boolean
    warnings: string[]
    errors: string[]
} {
    const warnings: string[] = []
    const errors: string[] = []

    // Validar versão do schema
    if (meta.schemaVersion !== '2025-12-26') {
        warnings.push(`Versão do schema diferente: ${meta.schemaVersion}. Pode haver incompatibilidades.`)
    }

    // Validar formato
    if (!['XLSX', 'CSV_ZIP'].includes(meta.format)) {
        errors.push(`Formato inválido: ${meta.format}`)
    }

    // Validar presença de metadados obrigatórios
    if (!meta.tenantId || !meta.tenantName) {
        errors.push('Metadados de tenant ausentes')
    }

    if (!meta.includedTables || meta.includedTables.length === 0) {
        errors.push('Nenhuma tabela incluída no backup')
    }

    return {
        compatible: errors.length === 0,
        warnings,
        errors
    }
}

/**
 * Retorna lista de tabelas permitidas para exportação
 */
export function getAllowedExportTables(): string[] {
    return [...DEFAULT_EXPORT_TABLES]
}

/**
 * Retorna lista de tabelas opcionais
 */
export function getOptionalExportTables(): string[] {
    return [...OPTIONAL_LOG_TABLES]
}

/**
 * Verifica se uma tabela tem coluna tenantId
 */
export function isMultiTenantTable(tableName: string): boolean {
    return getMultiTenantTables().includes(tableName)
}

/**
 * Retorna as colunas sensíveis que devem ser mascaradas/removidas
 */
export function getSensitiveColumns(tableName: string): string[] {
    const sensitiveMap: Record<string, string[]> = {
        'User': ['password'],
        'IntegrationConfig': ['apiKey', 'apiSecret'],
    }

    return sensitiveMap[tableName] || []
}

/**
 * Mascara dados sensíveis
 */
export function maskSensitiveData(tableName: string, row: any, includeSecrets: boolean): any {
    const maskedRow = { ...row }

    // User: NUNCA exportar password
    if (tableName === 'User') {
        delete maskedRow.password
    }

    // IntegrationConfig: mascarar secrets a menos que permitido
    if (tableName === 'IntegrationConfig' && !includeSecrets) {
        if (maskedRow.apiKey) {
            maskedRow.apiKey = '***MASKED***'
        }
        if (maskedRow.apiSecret) {
            maskedRow.apiSecret = '***MASKED***'
        }
    }

    return maskedRow
}
