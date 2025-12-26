import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Setting up RBAC permissions...')

    // Find the admin tenant and role
    const tenant = await prisma.tenant.findFirst({
        where: { name: 'Empresa Padrão' }
    })

    if (!tenant) {
        console.error('❌ Tenant not found. Run reset-admin.ts first.')
        return
    }

    const adminRole = await prisma.role.findFirst({
        where: {
            name: 'Administrador',
            tenantId: tenant.id
        }
    })

    if (!adminRole) {
        console.error('❌ Admin role not found. Run reset-admin.ts first.')
        return
    }

    console.log('✅ Found tenant:', tenant.name)
    console.log('✅ Found role:', adminRole.name)

    // Define system resources
    const resources = [
        { name: 'users', displayName: 'Usuários', description: 'Gerenciamento de usuários', module: 'settings' },
        { name: 'roles', displayName: 'Perfis', description: 'Gerenciamento de perfis e permissões', module: 'settings' },
        { name: 'rentals', displayName: 'Locações', description: 'Gerenciamento de contratos de locação', module: 'operations' },
        { name: 'inventory', displayName: 'Inventário', description: 'Gerenciamento de equipamentos', module: 'operations' },
        { name: 'persons', displayName: 'Pessoas', description: 'Gerenciamento de clientes e fornecedores', module: 'operations' },
        { name: 'financial', displayName: 'Financeiro', description: 'Gerenciamento financeiro', module: 'financial' },
        { name: 'tasks', displayName: 'Tarefas', description: 'Gerenciamento de tarefas', module: 'operations' },
        { name: 'maintenance', displayName: 'Manutenção', description: 'Gerenciamento de manutenções', module: 'operations' },
        { name: 'reports', displayName: 'Relatórios', description: 'Visualização de relatórios', module: 'reports' },
        { name: 'routes', displayName: 'Rotas', description: 'Planejamento de rotas', module: 'logistics' }
    ]

    console.log('\n📦 Creating resources...')

    for (const resourceData of resources) {
        const resource = await prisma.resource.upsert({
            where: { name: resourceData.name },
            update: resourceData,
            create: {
                ...resourceData,
                isActive: true
            }
        })

        console.log(`  ✓ Resource: ${resource.displayName}`)

        // Create permissions for each action
        const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'] as const

        for (const action of actions) {
            const permission = await prisma.permission.upsert({
                where: {
                    resourceId_action: {
                        resourceId: resource.id,
                        action: action
                    }
                },
                update: {},
                create: {
                    resourceId: resource.id,
                    action: action,
                    displayName: `${action} ${resource.displayName}`,
                    description: `Permissão para ${action.toLowerCase()} em ${resource.displayName.toLowerCase()}`
                }
            })

            // Grant MANAGE permission to admin role (MANAGE implies all other permissions)
            if (action === 'MANAGE') {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: adminRole.id,
                            permissionId: permission.id
                        }
                    },
                    update: { granted: true },
                    create: {
                        roleId: adminRole.id,
                        permissionId: permission.id,
                        granted: true
                    }
                })

                console.log(`    ✓ Permission: ${action} (granted to admin)`)
            } else {
                console.log(`    ✓ Permission: ${action}`)
            }
        }
    }

    console.log('\n✅ RBAC setup completed successfully!')
    console.log('🎭 Admin role has MANAGE permissions on all resources')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
