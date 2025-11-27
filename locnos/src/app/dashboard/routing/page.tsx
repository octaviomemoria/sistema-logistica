import { getOrders, getVehicles } from './actions'
import RoutePlanner from '@/components/routing/RoutePlanner'

export default async function RoutingPage() {
    const orders = await getOrders()
    const vehicles = await getVehicles()

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Route Planning</h1>
            <RoutePlanner initialOrders={orders} vehicles={vehicles} />
        </div>
    )
}
