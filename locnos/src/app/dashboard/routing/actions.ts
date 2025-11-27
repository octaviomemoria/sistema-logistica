'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function getOrders() {
  try {
    return await prisma.order.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return []
  }
}

export async function getVehicles() {
  try {
    return await prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE'
      }
    })
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
    return []
  }
}

export async function createRoute(data: {
  date: Date
  vehicleId: string
  orderIds: string[]
}) {
  try {
    const route = await prisma.route.create({
      data: {
        date: data.date,
        vehicleId: data.vehicleId,
        status: 'DRAFT',
        stops: {
          create: data.orderIds.map((orderId, index) => ({
            sequence: index + 1,
            orderId: orderId
          }))
        }
      }
    })

    // Update orders status
    await prisma.order.updateMany({
      where: {
        id: {
          in: data.orderIds
        }
      },
      data: {
        status: 'ASSIGNED'
      }
    })

    // Update vehicle status
    await prisma.vehicle.update({
      where: {
        id: data.vehicleId
      },
      data: {
        status: 'IN_TRANSIT' // Or keep available if it can do multiple routes? Let's say IN_TRANSIT for now.
      }
    })

    revalidatePath('/dashboard/routing')
    return { success: true, route }
  } catch (error) {
    console.error('Failed to create route:', error)
    return { success: false, error: 'Failed to create route' }
  }
}
