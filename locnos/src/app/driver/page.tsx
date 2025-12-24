'use client'

import { useState, useEffect } from 'react'
import { getDriverRoute, completeStop } from './actions'
import { MapPin, CheckCircle, Navigation, Package, ArrowRight, Phone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SignaturePad from '@/components/driver/SignaturePad'

export default function DriverPage() {
    const [route, setRoute] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    const [completingStopId, setCompletingStopId] = useState<string | null>(null)
    const [signature, setSignature] = useState('')
    const [receiverName, setReceiverName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadRoute()
    }, [])

    const loadRoute = async () => {
        setLoading(true)
        const res = await getDriverRoute()
        setRoute(res.route)
        setLoading(false)
    }

    const openCompletionModal = (stopId: string) => {
        setCompletingStopId(stopId)
        setSignature('')
        setReceiverName('')
    }

    const handleConfirmCompletion = async () => {
        if (!completingStopId) return
        if (!signature || !receiverName) {
            showToast('error', 'Assinatura e Nome são obrigatórios')
            return
        }

        setSubmitting(true)
        const res = await completeStop(completingStopId, { signature, receiverName })
        setSubmitting(false)

        if (res.success) {
            showToast('success', 'Parada concluída com sucesso!')
            setCompletingStopId(null)
            loadRoute()
        } else {
            showToast('error', res.error || 'Erro ao concluir')
        }
    }

    const openNavigation = (address: string) => {
        window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank')
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Buscando rota...</div>

    if (!route) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                    {/* <Truck size={48} className="text-gray-400" /> */} {/* Assuming Truck icon is removed or commented out */}
                </div>
                <h1 className="text-xl font-bold text-gray-800">Sem rota ativa</h1>
                <p className="text-gray-500 mt-2">Você não possui rotas confirmadas para hoje.</p>
            </div>
        )
    }

    const activeStops = route.stops.filter((s: any) => s.status !== 'COMPLETED')
    const completedStops = route.stops.filter((s: any) => s.status === 'COMPLETED')
    const currentStop = activeStops[0]

    return (
        <div className="space-y-6">
            {/* Completion Modal/Overlay */}
            {completingStopId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl p-6 space-y-4 animate-in slide-in-from-bottom-10">
                        <h3 className="text-lg font-bold text-gray-900">Confirmar Entrega/Coleta</h3>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nome do Recebedor</label>
                            <input
                                type="text"
                                className="w-full border rounded p-3"
                                placeholder="Quem está recebendo?"
                                value={receiverName}
                                onChange={e => setReceiverName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Assinatura Digital</label>
                            <SignaturePad onEnd={setSignature} />
                            <p className="text-xs text-gray-500 mt-1">Assine na área acima</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => setCompletingStopId(null)}
                                className="py-3 bg-gray-100 text-gray-700 font-bold rounded-lg"
                                disabled={submitting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmCompletion}
                                className="py-3 bg-green-600 text-white font-bold rounded-lg disabled:opacity-50"
                                disabled={submitting || !signature || !receiverName}
                            >
                                {submitting ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Card */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Rota de Hoje</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">{route.status}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{activeStops.length} <span className="text-sm font-normal text-gray-500">pendentes</span></p>
                        <p className="text-xs text-gray-400 mt-1">{completedStops.length} concluídas</p>
                    </div>
                </div>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(completedStops.length / route.stops.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current Stop - Featured */}
            {currentStop && (
                <div>
                    <h2 className="text-sm font-bold text-gray-700 uppercase mb-3 px-1">Próxima Parada</h2>
                    <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-600 overflow-hidden">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${currentStop.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {currentStop.type === 'DELIVERY' ? 'Entrega' : 'Coleta'}
                                </span>
                                <span className="text-gray-400 font-mono text-xs">#{currentStop.rentalId.slice(0, 6)}</span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-1">{currentStop.rental.person.name}</h3>

                            <div className="flex items-start gap-3 mt-4 text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <MapPin className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-sm leading-relaxed">
                                    {currentStop.rental.deliveryAddress || 'Endereço não informado'}
                                </p>
                            </div>

                            {currentStop.rental.person.phone && (
                                <a href={`tel:${currentStop.rental.person.phone}`} className="flex items-center gap-2 mt-3 text-sm text-green-600 font-medium">
                                    <Phone size={16} />
                                    {currentStop.rental.person.phone}
                                </a>
                            )}
                        </div>

                        <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
                            <button
                                onClick={() => openNavigation(currentStop.rental.deliveryAddress)}
                                className="p-4 flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-50 active:bg-blue-100"
                            >
                                <Navigation size={20} />
                                Navegar
                            </button>
                            <button
                                onClick={() => openCompletionModal(currentStop.id)}
                                className="p-4 flex items-center justify-center gap-2 text-green-600 font-bold hover:bg-green-50 active:bg-green-100"
                            >
                                <CheckCircle size={20} />
                                Concluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Other Stops */}
            {activeStops.length > 1 && (
                <div>
                    <h2 className="text-sm font-bold text-gray-700 uppercase mb-3 px-1">Na Sequência</h2>
                    <div className="space-y-3">
                        {activeStops.slice(1).map((stop: any) => (
                            <div key={stop.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between opacity-75">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${stop.type === 'DELIVERY' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {stop.type === 'DELIVERY' ? 'Ent' : 'Col'}
                                        </span>
                                        <h4 className="font-bold text-sm text-gray-800">{stop.rental.person.name}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{stop.rental.deliveryAddress}</p>
                                </div>
                                <div className="text-gray-300">
                                    <div className="text-xs font-bold bg-gray-100 h-6 w-6 flex items-center justify-center rounded-full">
                                        {stop.sequence}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
