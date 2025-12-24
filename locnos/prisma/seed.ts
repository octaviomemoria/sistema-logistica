import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clear existing data
    console.log('Clearing existing data...')
    await prisma.routeStop.deleteMany()
    await prisma.route.deleteMany()
    await prisma.order.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.user.deleteMany()

    // Create users
    console.log('Creating users...')
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@locnos.com',
                name: 'Admin User',
                password: 'hashed_password_here', // In production, use proper hashing
                role: 'ADMIN'
            }
        }),
        prisma.user.create({
            data: {
                email: 'driver1@locnos.com',
                name: 'João Silva',
                password: 'hashed_password_here',
                role: 'DRIVER'
            }
        }),
        prisma.user.create({
            data: {
                email: 'driver2@locnos.com',
                name: 'Maria Santos',
                password: 'hashed_password_here',
                role: 'DRIVER'
            }
        })
    ])
    console.log(`✅ Created ${users.length} users`)

    // Create vehicles
    console.log('Creating vehicles...')
    const vehicles = await Promise.all([
        prisma.vehicle.create({
            data: {
                plate: 'ABC-1234',
                model: 'Ford Transit',
                capacity: 1500,
                driverName: 'João Silva',
                status: 'AVAILABLE'
            }
        }),
        prisma.vehicle.create({
            data: {
                plate: 'DEF-5678',
                model: 'Mercedes Sprinter',
                capacity: 2000,
                driverName: 'Maria Santos',
                status: 'AVAILABLE'
            }
        }),
        prisma.vehicle.create({
            data: {
                plate: 'GHI-9012',
                model: 'Fiat Ducato',
                capacity: 1200,
                driverName: null,
                status: 'MAINTENANCE'
            }
        }),
        prisma.vehicle.create({
            data: {
                plate: 'JKL-3456',
                model: 'Renault Master',
                capacity: 1800,
                driverName: 'Carlos Oliveira',
                status: 'IN_TRANSIT'
            }
        }),
        prisma.vehicle.create({
            data: {
                plate: 'MNO-7890',
                model: 'Iveco Daily',
                capacity: 2500,
                driverName: null,
                status: 'AVAILABLE'
            }
        })
    ])
    console.log(`✅ Created ${vehicles.length} vehicles`)

    // Create orders
    console.log('Creating orders...')
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre']
    const customers = [
        'Empresa ABC Ltda',
        'Comércio XYZ',
        'Indústria 123',
        'Distribuidora Alfa',
        'Loja Beta',
        'Mercado Gama',
        'Atacado Delta',
        'Varejo Epsilon',
        'Fornecedor Zeta',
        'Cliente Theta'
    ]

    const orders = []
    for (let i = 0; i < 25; i++) {
        const status = i < 10 ? 'PENDING' : i < 18 ? 'ASSIGNED' : i < 23 ? 'DELIVERED' : 'CANCELLED'
        const order = await prisma.order.create({
            data: {
                customer: customers[i % customers.length],
                address: `Rua ${String.fromCharCode(65 + (i % 26))}, ${100 + i * 10}`,
                city: cities[i % cities.length],
                weight: Math.round((Math.random() * 500 + 50) * 10) / 10,
                status
            }
        })
        orders.push(order)
    }
    console.log(`✅ Created ${orders.length} orders`)

    // Create routes with stops
    console.log('Creating routes...')
    const route1 = await prisma.route.create({
        data: {
            date: new Date(),
            vehicleId: vehicles[0].id,
            status: 'IN_PROGRESS',
            stops: {
                create: [
                    { sequence: 1, orderId: orders[10].id },
                    { sequence: 2, orderId: orders[11].id },
                    { sequence: 3, orderId: orders[12].id }
                ]
            }
        }
    })

    const route2 = await prisma.route.create({
        data: {
            date: new Date(Date.now() + 86400000), // Tomorrow
            vehicleId: vehicles[1].id,
            status: 'CONFIRMED',
            stops: {
                create: [
                    { sequence: 1, orderId: orders[13].id },
                    { sequence: 2, orderId: orders[14].id }
                ]
            }
        }
    })

    const route3 = await prisma.route.create({
        data: {
            date: new Date(Date.now() - 86400000), // Yesterday
            vehicleId: vehicles[3].id,
            status: 'COMPLETED',
            stops: {
                create: [
                    { sequence: 1, orderId: orders[18].id },
                    { sequence: 2, orderId: orders[19].id },
                    { sequence: 3, orderId: orders[20].id }
                ]
            }
        }
    })

    console.log(`✅ Created 3 routes with stops`)

    console.log('✨ Database seeding completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
