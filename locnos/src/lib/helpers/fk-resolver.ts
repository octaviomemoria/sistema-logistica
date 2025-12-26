/**
 * Mapa de dependências entre tabelas (baseado nas FKs do schema)
 * Formato: { tabela: [dependências] }
 */
const TABLE_DEPENDENCIES: Record<string, string[]> = {
    // Core
    'User': ['Tenant', 'Role'],
    'Role': ['Tenant'],
    'RolePermission': ['Role', 'Permission'],
    'UserPermission': ['User', 'Permission'],
    'Permission': ['Resource'],
    'Resource': [],

    // Persons
    'PersonType': ['Tenant'],
    'Person': ['Tenant', 'User'], // createdBy
    'PersonPersonType': ['Person', 'PersonType'],

    // Inventory
    'Equipment': ['Tenant'],
    'Asset': ['Equipment', 'Tenant'],
    'InventoryMovement': ['Equipment', 'User', 'Tenant'],

    // Maintenance
    'Maintenance': ['Equipment', 'Person', 'Tenant'],

    // Rentals
    'Rental': ['Person', 'User', 'Tenant'],
    'RentalItem': ['Rental', 'Equipment'],
    'RentalOccurrence': ['Rental'],
    'Payment': ['Rental', 'Tenant'],

    // Routes
    'Route': ['User', 'Tenant'],
    'RouteStop': ['Route', 'Rental'],

    // Tasks
    'Task': ['User', 'Tenant'],
    'Subtask': ['Task', 'Tenant'],

    // Financial
    'ChartOfAccount': ['Tenant'],
    'CostCenter': ['Tenant'],
    'BankAccount': ['Tenant'],
    'IntegrationConfig': ['Tenant'],
    'FinancialTitle': ['ChartOfAccount', 'CostCenter', 'Tenant'],
    'FinancialMovement': ['BankAccount', 'FinancialTitle', 'ChartOfAccount', 'Tenant'],
    'BankStatementItem': ['FinancialMovement'],

    // Templates
    'ContractTemplate': ['Tenant'],

    // Audit
    'AuditLog': ['User', 'Tenant'],
    'IntegrationLog': ['Tenant'],
    'LoginAttempt': ['User', 'Tenant'],
    'UserSession': ['User'],

    // Backup
    'BackupJob': ['User', 'Tenant'],

    // Global (sem dependências ou mínimas)
    'Tenant': [],
}

/**
 * Resolve a ordem de importação baseada em dependências de FK
 * Usa ordenação topológica
 */
export function resolveImportOrder(tables: string[]): string[] {
    const resolved: string[] = []
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // Construir grafo
    for (const table of tables) {
        graph.set(table, TABLE_DEPENDENCIES[table] || [])
        inDegree.set(table, 0)
    }

    // Calcular in-degree (quantas dependências cada tabela tem)
    for (const table of tables) {
        const deps = graph.get(table) || []
        for (const dep of deps) {
            if (tables.includes(dep)) {
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1)
            }
        }
    }

    // Kahn's algorithm para ordenação topológica
    const queue: string[] = []

    // Começar com tabelas sem dependências
    for (const [table, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(table)
        }
    }

    while (queue.length > 0) {
        const table = queue.shift()!
        resolved.push(table)

        // Remover dependências desta tabela
        const deps = graph.get(table) || []
        for (const dep of deps) {
            if (tables.includes(dep)) {
                const newDegree = (inDegree.get(dep) || 0) - 1
                inDegree.set(dep, newDegree)

                if (newDegree === 0) {
                    queue.push(dep)
                }
            }
        }
    }

    // Verificar se há ciclos (se resolved.length < tables.length)
    if (resolved.length < tables.length) {
        const missing = tables.filter(t => !resolved.includes(t))
        console.warn('Referências circulares detectadas em:', missing)
        // Adicionar as tabelas faltantes no final
        resolved.push(...missing)
    }

    return resolved.reverse() // Reverter para ordem de importação (dependências primeiro)
}

/**
 * Resolve a ordem de deleção baseada em FKs (ordem inversa de importação)
 */
export function resolveDeleteOrder(tables: string[]): string[] {
    const importOrder = resolveImportOrder(tables)
    return importOrder.reverse() // Filhos primeiro, depois pais
}

/**
 * Retorna as tabelas que possuem tenantId
 */
export function getMultiTenantTables(): string[] {
    return [
        'User',
        'Role',
        'PersonType',
        'Person',
        'Equipment',
        'Asset',
        'InventoryMovement',
        'Maintenance',
        'Rental',
        'RentalItem',
        'RentalOccurrence',
        'Payment',
        'Route',
        'RouteStop',
        'Task',
        'Subtask',
        'ChartOfAccount',
        'CostCenter',
        'BankAccount',
        'IntegrationConfig',
        'FinancialTitle',
        'FinancialMovement',
        'ContractTemplate',
        'AuditLog',
        'IntegrationLog',
        'LoginAttempt',
        'BackupJob'
    ]
}

/**
 * Retorna as tabelas globais (sem tenantId)
 */
export function getGlobalTables(): string[] {
    return [
        'Resource',
        'Permission',
        'UserSession',
        'BankStatementItem'
    ]
}
