import ExcelJS from 'exceljs'

export interface BackupMeta {
    systemVersion: string
    schemaVersion: string
    exportedAt: string
    tenantId: string
    tenantName: string
    format: 'XLSX' | 'CSV_ZIP'
    includedTables: string[]
    includeSecrets?: boolean
    includeLogs?: boolean
}

export interface TableData {
    name: string
    rows: any[]
}

/**
 * Cria um workbook XLSX com os dados de backup
 */
export async function createWorkbook(meta: BackupMeta, tables: TableData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()

    workbook.creator = 'Locnos Backup System'
    workbook.created = new Date()

    // Adicionar aba __META__
    addMetaSheet(workbook, meta)

    // Adicionar uma aba por tabela
    for (const table of tables) {
        if (table.rows.length > 0) {
            addTableSheet(workbook, table.name, table.rows)
        }
    }

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}

/**
 * Lê um workbook XLSX de backup
 */
export async function readWorkbook(buffer: Buffer): Promise<{
    meta: BackupMeta
    tables: TableData[]
}> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    // Ler __META__
    const metaSheet = workbook.getWorksheet('__META__')
    if (!metaSheet) {
        throw new Error('Arquivo de backup inválido: sem aba __META__')
    }

    const meta = readMetaSheet(metaSheet)

    // Ler todas as outras abas (tabelas)
    const tables: TableData[] = []

    workbook.eachSheet((worksheet, sheetId) => {
        if (worksheet.name !== '__META__') {
            const tableData = readTableSheet(worksheet)
            tables.push(tableData)
        }
    })

    return { meta, tables }
}

/**
 * Adiciona aba __META__ ao workbook
 */
function addMetaSheet(workbook: ExcelJS.Workbook, meta: BackupMeta): void {
    const sheet = workbook.addWorksheet('__META__')

    sheet.columns = [
        { header: 'Chave', key: 'key', width: 25 },
        { header: 'Valor', key: 'value', width: 50 }
    ]

    sheet.addRows([
        { key: 'systemVersion', value: meta.systemVersion },
        { key: 'schemaVersion', value: meta.schemaVersion },
        { key: 'exportedAt', value: meta.exportedAt },
        { key: 'tenantId', value: meta.tenantId },
        { key: 'tenantName', value: meta.tenantName },
        { key: 'format', value: meta.format },
        { key: 'includedTables', value: meta.includedTables.join(', ') },
        { key: 'includeSecrets', value: meta.includeSecrets ? 'Sim' : 'Não' },
        { key: 'includeLogs', value: meta.includeLogs ? 'Sim' : 'Não' }
    ])

    // Estilo do header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    }
}

/**
 * Lê aba __META__
 */
function readMetaSheet(sheet: ExcelJS.Worksheet): BackupMeta {
    const meta: any = {}

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Pular header
            const key = row.getCell(1).value as string
            const value = row.getCell(2).value

            if (key === 'includedTables') {
                meta[key] = (value as string).split(', ')
            } else if (key === 'includeSecrets' || key === 'includeLogs') {
                meta[key] = value === 'Sim'
            } else {
                meta[key] = value
            }
        }
    })

    return meta as BackupMeta
}

/**
 * Adiciona uma aba de tabela ao workbook
 */
function addTableSheet(workbook: ExcelJS.Workbook, tableName: string, rows: any[]): void {
    if (rows.length === 0) return

    const sheet = workbook.addWorksheet(tableName)

    // Obter colunas do primeiro registro
    const columns = Object.keys(rows[0]).map(key => ({
        header: key,
        key: key,
        width: 15
    }))

    sheet.columns = columns

    // Adicionar dados
    for (const row of rows) {
        // Converter JSON para string
        const processedRow: any = {}
        for (const [key, value] of Object.entries(row)) {
            if (value === null || value === undefined) {
                processedRow[key] = null
            } else if (typeof value === 'object') {
                processedRow[key] = JSON.stringify(value)
            } else if (value instanceof Date) {
                processedRow[key] = value.toISOString()
            } else {
                processedRow[key] = value
            }
        }
        sheet.addRow(processedRow)
    }

    // Estilo do header
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
    }
}

/**
 * Lê dados de uma aba de tabela
 */
function readTableSheet(sheet: ExcelJS.Worksheet): TableData {
    const rows: any[] = []
    const headers: string[] = []

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            // Header
            row.eachCell((cell, colNumber) => {
                headers.push(cell.value as string)
            })
        } else {
            // Data row
            const rowData: any = {}
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1]
                let value = cell.value

                // Tentar parsear JSON se for string
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        value = JSON.parse(value)
                    } catch (e) {
                        // Manter como string
                    }
                }

                rowData[header] = value
            })
            rows.push(rowData)
        }
    })

    return {
        name: sheet.name,
        rows
    }
}
