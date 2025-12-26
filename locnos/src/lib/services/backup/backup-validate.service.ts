import { readWorkbook } from '@/lib/helpers/xlsx-helper'
import { validateBackupCompatibility } from './backup-meta.service'
import { resolveImportOrder } from '@/lib/helpers/fk-resolver'

export interface ValidationReport {
    compatible: boolean
    errors: ValidationError[]
    warnings: string[]
    summary: {
        totalTables: number
        totalRecords: number
        estimatedTime: string
    }
    tableDetails: TableValidation[]
}

export interface ValidationError {
    table: string
    row?: number
    field?: string
    message: string
    severity: 'error' | 'warning'
}

export interface TableValidation {
    tableName: string
    recordCount: number
    errors: ValidationError[]
    warnings: string[]
}

/**
 * Valida arquivo de backup sem importar (dry-run)
 */
export async function validateBackupFile(fileBuffer: Buffer): Promise<ValidationReport> {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    const tableDetails: TableValidation[] = []

    try {
        // Ler arquivo
        const { meta, tables } = await readWorkbook(fileBuffer)

        // Validar compatibilidade
        const compatCheck = validateBackupCompatibility(meta)

        if (!compatCheck.compatible) {
            compatCheck.errors.forEach(err => {
                errors.push({
                    table: '__META__',
                    message: err,
                    severity: 'error'
                })
            })
        }

        warnings.push(...compatCheck.warnings)

        // Validar cada tabela
        let totalRecords = 0

        for (const table of tables) {
            const tableValidation = validateTable(table.name, table.rows)
            tableDetails.push(tableValidation)
            totalRecords += table.rows.length

            errors.push(...tableValidation.errors)
            warnings.push(...tableValidation.warnings)
        }

        // Calcular estimativa de tempo (aprox. 100 registros/segundo)
        const estimatedSeconds = Math.ceil(totalRecords / 100)
        const estimatedTime = estimatedSeconds > 60
            ? `${Math.ceil(estimatedSeconds / 60)} minutos`
            : `${estimatedSeconds} segundos`

        return {
            compatible: errors.length === 0,
            errors,
            warnings,
            summary: {
                totalTables: tables.length,
                totalRecords,
                estimatedTime
            },
            tableDetails
        }
    } catch (error: any) {
        errors.push({
            table: '__FILE__',
            message: `Erro ao processar arquivo: ${error.message}`,
            severity: 'error'
        })

        return {
            compatible: false,
            errors,
            warnings,
            summary: {
                totalTables: 0,
                totalRecords: 0,
                estimatedTime: '0s'
            },
            tableDetails: []
        }
    }
}

/**
 * Valida dados de uma tabela
 */
function validateTable(tableName: string, rows: any[]): TableValidation {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    if (rows.length === 0) {
        warnings.push(`Tabela ${tableName} está vazia`)
        return { tableName, recordCount: 0, errors, warnings }
    }

    // Validar cada registro
    rows.forEach((row, index) => {
        const rowErrors = validateRow(tableName, row, index + 1)
        errors.push(...rowErrors)
    })

    return {
        tableName,
        recordCount: rows.length,
        errors,
        warnings
    }
}

/**
 * Valida um registro individual
 */
function validateRow(tableName: string, row: any, rowNumber: number): ValidationError[] {
    const errors: ValidationError[] = []

    // Validações específicas por tabela
    switch (tableName) {
        case 'User':
            if (!row.email || typeof row.email !== 'string') {
                errors.push({
                    table: tableName,
                    row: rowNumber,
                    field: 'email',
                    message: 'Email inválido ou ausente',
                    severity: 'error'
                })
            }

            if (!row.tenantId) {
                errors.push({
                    table: tableName,
                    row: rowNumber,
                    field: 'tenantId',
                    message: 'tenantId obrigatório',
                    severity: 'error'
                })
            }
            break

        case 'Person':
            if (!row.document) {
                errors.push({
                    table: tableName,
                    row: rowNumber,
                    field: 'document',
                    message: 'CPF/CNPJ obrigatório',
                    severity: 'error'
                })
            }
            break

        case 'Equipment':
            if (!row.name) {
                errors.push({
                    table: tableName,
                    row: rowNumber,
                    field: 'name',
                    message: 'Nome do equipamento obrigatório',
                    severity: 'error'
                })
            }
            break

        case 'FinancialTitle':
            if (!row.originalValue || isNaN(parseFloat(row.originalValue))) {
                errors.push({
                    table: tableName,
                    row: rowNumber,
                    field: 'originalValue',
                    message: 'Valor original inválido',
                    severity: 'error'
                })
            }
            break
    }

    // Validações genéricas

    // Validar tipos de campo comuns
    if (row.createdAt && !isValidDate(row.createdAt)) {
        errors.push({
            table: tableName,
            row: rowNumber,
            field: 'createdAt',
            message: 'Data de criação inválida',
            severity: 'warning'
        })
    }

    if (row.updatedAt && !isValidDate(row.updatedAt)) {
        errors.push({
            table: tableName,
            row: rowNumber,
            field: 'updatedAt',
            message: 'Data de atualização inválida',
            severity: 'warning'
        })
    }

    return errors
}

/**
 * Valida se é uma data válida
 */
function isValidDate(value: any): boolean {
    if (!value) return false

    const date = new Date(value)
    return !isNaN(date.getTime())
}

/**
 * Valida se tabelas têm ordem correta de importação
 */
export function validateImportOrder(tableNames: string[]): {
    valid: boolean
    suggestedOrder: string[]
    issues: string[]
} {
    const issues: string[] = []
    const suggestedOrder = resolveImportOrder(tableNames)

    // Verificar se ordem atual difere da sugerida
    const currentOrder = tableNames.join(',')
    const optimalOrder = suggestedOrder.join(',')

    if (currentOrder !== optimalOrder) {
        issues.push('Ordem de importação pode não respeitar dependências de FK')
    }

    return {
        valid: issues.length === 0,
        suggestedOrder,
        issues
    }
}
