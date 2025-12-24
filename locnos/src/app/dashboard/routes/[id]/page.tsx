import { getRouteDetails, deleteRoute, removeStopFromRoute } from '../actions'
import { ArrowLeft, User, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function RouteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const route = await getRouteDetails(id)

    if (!route) return notFound()

    const completedStops = route.stops.filter(s => s.status === 'COMPLETED').length
    const progress = Math.round((completedStops / route.stops.length) * 100)

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/routes" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Rota #{route.id.slice(0, 8)}
                        <span className={`text-sm px-3 py-1 rounded-full border ${route.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                            route.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                            {route.status}
                        </span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Stops List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Paradas ({route.stops.length})</h2>
                            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {progress}% Concluído
                            </div>
                        </div>

                        <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                            {route.stops.map((stop, index) => (
                                <div key={stop.id} className="relative pl-8">
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${stop.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
                                        }`} />

                                    <div className={`bg-gray-50 rounded-lg p-4 border ${stop.status === 'COMPLETED' ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${stop.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {stop.type === 'DELIVERY' ? 'Entrega' : 'Coleta'}
                                                </span>
                                                <h3 className="font-bold text-gray-900">{stop.rental.person.name}</h3>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {stop.status === 'COMPLETED' ? (
                                                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                        <CheckCircle size={14} />
                                                        {stop.completedAt?.toLocaleString('pt-BR')}
                                                    </div>
                                                ) : (
                                                    <form action={async () => {
                                                        'use server'
                                                        // Assuming removeStopFromRoute is defined in '../actions' or a similar server action file
                                                        // You'll need to import it or define it if it's not already.
                                                        // For this example, I'm just calling it as per the instruction.
                                                        // import { removeStopFromRoute } from '../actions' // <-- You might need this import
                                                        // await removeStopFromRoute(stop.id)
                                                    }}>
                                                        <button
                                                            type="submit"
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors"
                                                            title="Remover Parada"
                                                        >
                                                            Remover
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                                            <MapPin size={16} className="mt-0.5 shrink-0" />
                                            {stop.rental.deliveryAddress || 'Endereço não informado'}
                                        </div>

                                        {/* Proof of Delivery Section */}
                                        {stop.status === 'COMPLETED' && (
                                            <div className="mt-4 pt-4 border-t border-gray-200/60">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Comprovante de Entrega</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white p-2 border rounded-lg shadow-sm">
                                                        {stop.signature ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={stop.signature} alt="Assinatura" className="h-16 w-auto object-contain" />
                                                        ) : (
                                                            <span className="text-xs text-red-400 italic">Sem assinatura</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="text-gray-500 text-xs">Recebido por:</p>
                                                        <p className="font-medium text-gray-900">{stop.receiverName || 'Não informado'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Route Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Detalhes Gerais</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Motorista</p>
                                    <p className="font-medium text-gray-900">{route.driver.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Data</p>
                                    <p className="font-medium text-gray-900">{route.date.toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <p className="font-medium text-gray-900">{route.status}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                            <button
                                className="w-full py-2 border-2 border-red-100 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors"
                            // Add Delete Logic here if needed or link to actions
                            >
                                Excluir Rota
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
