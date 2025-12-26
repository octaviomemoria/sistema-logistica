import archiver from 'archiver'
import { Readable } from 'stream'
import { BackupMeta, TableData } from './xlsx-helper'

/**
 * Cria um arquivo ZIP com CSVs de backup
 */
export async function createZipArchive(meta: BackupMeta, tables: TableData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const archive = archiver('zip', {
            zlib: { level: 9 } // Máxima compressão
        })

        // Capturar dados do stream
        archive.on('data', (chunk) => chunks.push(chunk))
        archive.on('end', () => resolve(Buffer.concat(chunks)))
        archive.on('error', (err) => reject(err))

        // Adicionar __META__.json
        const metaJson = JSON.stringify(meta, null, 2)
        archive.append(metaJson, { name: '__META__.json' })

        // Adicionar um CSV por tabela
        for (const table of tables) {
            if (table.rows.length > 0) {
                const csv = arrayToCsv(table.rows)
                archive.append(csv, { name: `${table.name}.csv` })
            }
        }

        archive.finalize()
    })
}

/**
 * Extrai dados de um arquivo ZIP com CSVs
 */
export async function extractZipArchive(buffer: Buffer): Promise<{
    meta: BackupMeta
    tables: TableData[]
}> {
    // Para extrair ZIP, precisaríamos de uma biblioteca adicional como 'adm-zip'
    // Por simplicidade, vou implementar apenas a exportação ZIP
    // A importação pode ser feita via XLSX apenas por enquanto

    throw new Error('Importação de ZIP não implementada ainda. Use formato XLSX.')
}

/**
 * Converte array de objetos para CSV
 */
export function arrayToCsv(rows: any[]): string {
    if (rows.length === 0) return ''

    // Header
    const headers = Object.keys(rows[0])
    const headerLine = headers.map(h => escapeCsvValue(h)).join(',')

    // Linhas
    const lines = rows.map(row => {
        return headers.map(header => {
            const value = row[header]

            if (value === null || value === undefined) {
                return ''
            }

            if (typeof value === 'object') {
                return escapeCsvValue(JSON.stringify(value))
            }

            if (value instanceof Date) {
                return escapeCsvValue(value.toISOString())
            }

            return escapeCsvValue(String(value))
        }).join(',')
    })

    return [headerLine, ...lines].join('\n')
}

/**
 * Converte CSV para array de objetos
 */
export function csvToArray(csvString: string): any[] {
    const lines = csvString.split('\n').filter(line => line.trim())

    if (lines.length === 0) return []

    const headers = parseCsvLine(lines[0])
    const rows: any[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i])
        const row: any = {}

        headers.forEach((header, index) => {
            let value = values[index] || null

            // Tentar parsear JSON
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    value = JSON.parse(value)
                } catch (e) {
                    // Manter como string
                }
            }

            row[header] = value
        })

        rows.push(row)
    }

    return rows
}

/**
 * Escapa valor para CSV (adiciona aspas se necessário)
 */
function escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

/**
 * Parse de uma linha CSV respeitando aspas
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Aspas duplas escapadas
                current += '"'
                i++ // Pular próximo char
            } else {
                // Toggle quotes
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }

    result.push(current)
    return result
}
