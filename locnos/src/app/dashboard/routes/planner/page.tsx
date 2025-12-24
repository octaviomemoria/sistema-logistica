'use client'

import { useState, useEffect } from 'react'
import { getRouteData, createRoute } from '../actions'
import { ArrowRight, Truck, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function RoutePlannerPage() {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([])
    const [selectedDriverId, setSelectedDriverId] = useState('')

    const { showToast } = useToast()
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [date])

    const loadData = async () => {
        setLoading(true)
        const res = await getRouteData(date)
        setData(res)
        setLoading(false)
    }

    const toggleJob = (id: string) => {
        setSelectedJobIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const handleCreateRoute = async () => {
        if (!selectedDriverId || selectedJobIds.length === 0) return

        // Build stops array
        // We need to find the job (delivery or return) for each selected ID
        const stops = []
        let sequence = 1

        for (const id of selectedJobIds) {
            const delivery = data.availableJobs.deliveries.find((d: any) => d.id === id)
            if (delivery) {
                stops.push({ rentalId: id, type: 'DELIVERY', sequence: sequence++ })
                continue
            }
            const rentalReturn = data.availableJobs.returns.find((r: any) => r.id === id)
            if (rentalReturn) {
                stops.push({ rentalId: id, type: 'RETURN', sequence: sequence++ })
            }
        }

        const res = await createRoute({
            date: new Date(date),
            driverId: selectedDriverId,
            stops: stops as any
        })

        if (res.success) {
            showToast('success', 'Rota criada com sucesso')
            setSelectedJobIds([])
            setSelectedDriverId('')
            loadData()
            router.push('/dashboard/routes')
        } else {
            showToast('error', res.error || 'Erro ao criar rota')
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando planejador...</div>

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Truck className="text-blue-600" />
                Planejador de Rotas
            </h1>

            {/* Date Selector */}
            <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded shadow-sm border">
                <Calendar className="text-gray-500" />
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="border rounded p-2"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Jobs */}
                <div>
                    <h2 className="font-semibold text-lg mb-4">Tarefas Pendentes ({date})</h2>
                    <div className="space-y-4">
                        {/* Deliveries */}
                        {data?.availableJobs?.deliveries.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="text-blue-800 font-bold mb-2 text-sm uppercase">Entregas (Início de Locação)</h3>
                                <div className="space-y-2">
                                    {data.availableJobs.deliveries.map((rental: any) => (
                                        <div
                                            key={rental.id}
                                            onClick={() => toggleJob(rental.id)}
                                            className={`p-3 bg-white rounded border cursor-pointer hover:shadow-md transition-all flex justify-between items-center ${selectedJobIds.includes(rental.id) ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                                        >
                                            <div>
                                                <p className="font-bold">#{rental.id.slice(0, 8)} - {rental.person.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <MapPin size={12} /> {rental.deliveryAddress || 'Endereço não informado'}
                                                </p>
                                            </div>
                                            {selectedJobIds.includes(rental.id) && <div className="h-3 w-3 bg-blue-500 rounded-full" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Returns */}
                        {data?.availableJobs?.returns.length > 0 && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <h3 className="text-orange-800 font-bold mb-2 text-sm uppercase">Coletas (Fim de Locação)</h3>
                                <div className="space-y-2">
                                    {data.availableJobs.returns.map((rental: any) => (
                                        <div
                                            key={rental.id}
                                            onClick={() => toggleJob(rental.id)}
                                            className={`p-3 bg-white rounded border cursor-pointer hover:shadow-md transition-all flex justify-between items-center ${selectedJobIds.includes(rental.id) ? 'ring-2 ring-orange-500 border-transparent' : ''}`}
                                        >
                                            <div>
                                                <p className="font-bold">#{rental.id.slice(0, 8)} - {rental.person.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <MapPin size={12} /> {rental.deliveryAddress || 'Endereço não informado'}
                                                </p>
                                            </div>
                                            {selectedJobIds.includes(rental.id) && <div className="h-3 w-3 bg-orange-500 rounded-full" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data?.availableJobs?.deliveries.length === 0 && data?.availableJobs?.returns.length === 0 && (
                            <p className="text-gray-500 italic">Nenhuma entrega ou coleta pendente para esta data.</p>
                        )}
                    </div>
                </div>

                {/* Assignment Panel */}
                <div className="bg-gray-50 p-6 rounded-xl border h-fit sticky top-6">
                    <h2 className="font-bold text-lg mb-4">Criar Rota</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Motorista Responsável</label>
                        <select
                            className="w-full p-2 border rounded bg-white"
                            value={selectedDriverId}
                            onChange={e => setSelectedDriverId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {data?.drivers?.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm font-medium mb-2">Paradas Selecionadas: <span className="text-blue-600 font-bold">{selectedJobIds.length}</span></p>
                        <div className="space-y-1">
                            {selectedJobIds.map((id, index) => (
                                <div key={id} className="text-xs bg-white p-2 rounded border flex gap-2 items-center">
                                    <span className="font-bold bg-gray-200 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">{index + 1}</span>
                                    <span>Locação #{id.slice(0, 8)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleCreateRoute}
                        disabled={selectedJobIds.length === 0 || !selectedDriverId}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        Criar Rota <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
