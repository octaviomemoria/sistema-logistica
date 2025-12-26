import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Definição de recursos e suas permissões
const RESOURCES = [
    {
        name: 'users',
        displayName: 'Usuários',
        description: 'Gestão de usuários do sistema',
        module: 'settings',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE']
    },
    {
        name: 'roles',
        displayName: 'Perfis de Acesso',
        description: 'Gestão de perfis e permissões',
        module: 'settings',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE']
    },
    {
        name: 'persons',
        displayName: 'Pessoas e Clientes',
        description: 'Cadastro de clientes, fornecedores, etc.',
        module: 'core',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT']
    },
    {
        name: 'rentals',
        displayName: 'Locações',
        description: 'Gestão de locações de equipamentos',
        module: 'operations',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT']
    },
    {
        name: 'inventory',
        displayName: 'Inventário',
        description: 'Gestão de equipamentos e estoque',
        module: 'operations',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT']
    },
    {
        name: 'maintenance',
        displayName: 'Manutenção',
        description: 'Gestão de manutenções de equipamentos',
        module: 'operations',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE']
    },
    {
        name: 'finance',
        displayName: 'Financeiro',
        description: 'Gestão financeira e títulos',
        module: 'finance',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT']
    },
    {
        name: 'reports',
        displayName: 'Relatórios',
        description: 'Visualização e exportação de relatórios',
        module: 'reports',
        permissions: ['VIEW', 'EXPORT']
    },
    {
        name: 'tasks',
        displayName: 'Tarefas',
        description: 'Gestão de tarefas e checklist',
        module: 'operations',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
    },
    {
        name: 'routes',
        displayName: 'Rotas e Entregas',
        description: 'Planejamento e gestão de rotas',
        module: 'operations',
        permissions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE']
    }
] as const

// Perfis padrão do sistema (serão criados sem tenant específico)
// Nota: Quando um tenant é criado, estes perfis são copiados para ele
const SYSTEM_ROLES = [
    {
        name: 'Administrador',
        description: 'Acesso completo a todos os módulos',
        isSystem: true,
        permissions: '*' // Todas as permissões
    },
    {
        name: 'Gerente Financeiro',
        description: 'Acesso completo ao módulo financeiro',
        isSystem: true,
        permissions: {
            finance: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'],
            reports: ['VIEW', 'EXPORT'],
            rentals: ['VIEW', 'APPROVE'],
            persons: ['VIEW']
        }
    },
    {
        name: 'Gerente Operacional',
        description: 'Acesso completo aos módulos operacionais',
        isSystem: true,
        permissions: {
            rentals: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'],
            inventory: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'],
            maintenance: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'],
            tasks: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
            routes: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'],
            persons: ['VIEW', 'CREATE', 'EDIT'],
            reports: ['VIEW', 'EXPORT']
        }
    },
    {
        name: 'Operador',
        description: 'Operações básicas do dia a dia',
        isSystem: true,
        permissions: {
            rentals: ['VIEW', 'CREATE', 'EDIT'],
            inventory: ['VIEW'],
            maintenance: ['VIEW', 'CREATE'],
            tasks: ['VIEW', 'CREATE', 'EDIT'],
            routes: ['VIEW'],
            persons: ['VIEW', 'CREATE', 'EDIT'],
            reports: ['VIEW']
        }
    },
    {
        name: 'Consulta',
        description: 'Apenas visualização (somente leitura)',
        isSystem: true,
        permissions: {
            rentals: ['VIEW'],
            inventory: ['VIEW'],
            maintenance: ['VIEW'],
            tasks: ['VIEW'],
            routes: ['VIEW'],
            persons: ['VIEW'],
            finance: ['VIEW'],
            reports: ['VIEW']
        }
    }
] as const

async function main() {
    console.log('🌱 Seeding RBAC data...')

    // 1. Criar recursos
    console.log('\n📦 Creating resources...')
    const resourcesMap = new Map<string, string>()

    for (const resourceData of RESOURCES) {
        const resource = await prisma.resource.upsert({
            where: { name: resourceData.name },
            update: {},
            create: {
                name: resourceData.name,
                displayName: resourceData.displayName,
                description: resourceData.description,
                module: resourceData.module
            }
        })
        resourcesMap.set(resource.name, resource.id)
        console.log(`  ✓ ${resource.displayName} (${resource.name})`)

        // 2. Criar permissões para cada recurso
        for (const action of resourceData.permissions) {
            await prisma.permission.upsert({
                where: {
                    resourceId_action: {
                        resourceId: resource.id,
                        action: action as any
                    }
                },
                update: {},
                create: {
                    resourceId: resource.id,
                    action: action as any,
                    displayName: `${action} - ${resource.displayName}`,
                    description: `Permissão para ${action.toLowerCase()} em ${resource.displayName.toLowerCase()}`
                }
            })
        }
    }

    // 4. Buscar tenant existente (Empresa Principal)
    const existingTenant = await prisma.tenant.findFirst({
        where: { document: '00.000.000/0001-91' }
    })

    if (!existingTenant) {
        console.log('\n⚠️  No tenant found. Skipping role creation.')
        console.log('   Run seed-recovery.ts first to create a tenant.')
        return
    }

    console.log(`\n📍 Creating roles for tenant: ${existingTenant.name}`)

    // 5. Buscar todas as permissões criadas
    const allPermissions = await prisma.permission.findMany({
        include: { resource: true }
    })

    // 6. Criar perfis do sistema para este tenant
    console.log('\n👥 Creating system roles...')

    for (const roleData of SYSTEM_ROLES) {
        // Criar o perfil
        const role = await prisma.role.upsert({
            where: {
                name_tenantId: {
                    name: roleData.name,
                    tenantId: existingTenant.id
                }
            },
            update: {},
            create: {
                name: roleData.name,
                description: roleData.description,
                isSystem: roleData.isSystem,
                tenantId: existingTenant.id
            }
        })
        console.log(`  ✓ ${role.name}`)

        // Atribuir permissões
        let permissionsToGrant: any[] = []

        if ('permissions' in roleData && roleData.permissions === '*') {
            // Admin: todas as permissões
            permissionsToGrant = allPermissions
        } else if ('permissions' in roleData && typeof roleData.permissions === 'object') {
            // Perfis específicos: filtrar permissões
            for (const [resourceName, actions] of Object.entries(roleData.permissions)) {
                const resourcePerms = allPermissions.filter(
                    (p: any) => p.resource.name === resourceName && (actions as any).includes(p.action)
                )
                permissionsToGrant.push(...resourcePerms)
            }
        }

        // Criar as relações RolePermission
        for (const permission of permissionsToGrant) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id
                    }
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                    granted: true
                }
            })
        }
        console.log(`    → ${permissionsToGrant.length} permissões atribuídas`)
    }

    console.log('\n✅ RBAC seed completed!')
    console.log(`   📊 ${RESOURCES.length} recursos`)
    console.log(`   🔑 ${allPermissions.length} permissões`)
    console.log(`   👥 ${SYSTEM_ROLES.length} perfis do sistema`)
}

main()
    .catch(e => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
