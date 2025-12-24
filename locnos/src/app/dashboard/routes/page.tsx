import Link from 'next/link'
import { getRouteData } from './actions'
import { Plus, Truck } from 'lucide-react'
import RouteCard from '@/components/routes/RouteCard'

export default async function RoutesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const { date } = await searchParams
    const { routes } = await getRouteData(date)

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Gestão de Rotas
                    </h1>
                    <p className="text-gray-500 text-sm">Organize as entregas e coletas</p>
                </div>

                <Link
                    href="/dashboard/routes/planner"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Nova Rota/Planejador
                </Link>
            </div>

            {/* Date Filter (Simple implementation) */}
            <div className="mb-6">
                <form className="flex item-center gap-2">
                    <input
                        type="date"
                        name="date"
                        defaultValue={date || new Date().toISOString().split('T')[0]}
                        className="border rounded p-2 text-sm"
                    />
                    <button type="submit" className="bg-gray-100 px-3 py-2 rounded border hover:bg-gray-200">Filtrar</button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route: any) => (
                    <RouteCard key={route.id} route={route} />
                ))}
            </div>

            {routes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded border border-dashed">
                    <p className="text-gray-500">Nenhuma rota encontrada para esta data.</p>
                </div>
            )}
        </div>
    )
}
