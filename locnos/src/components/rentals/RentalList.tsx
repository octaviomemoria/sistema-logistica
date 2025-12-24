'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Filter, Phone, MapPin, Clock, Truck } from 'lucide-react'
import { getRentals, RentalFilters } from '@/app/dashboard/rentals/actions'
import RentalActions from './RentalActions'

export default function RentalList() {
    const [rentals, setRentals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters State
    const [filters, setFilters] = useState<RentalFilters>({
        type: 'ALL',
        status: 'active_only', // Default as per request "não encerrados"
        search: '',
        startDate: '',
        endDate: ''
    })

    const fetchRentals = () => {
        setLoading(true)
        getRentals(filters).then(res => {
            if (res.success) setRentals(res.rentals || [])
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchRentals()
    }, [filters])

    // Helpers for Status Calculation
    const getDeliveryStatus = (rental: any) => {
        if (rental.status === 'DRAFT') return { label: 'Orçamento', color: 'bg-gray-100 text-gray-700' }
        if (rental.status === 'SCHEDULED') return { label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' }
        if (rental.status === 'ACTIVE' || rental.status === 'LATE') return { label: 'Entregue', color: 'bg-blue-100 text-blue-800' }
        return { label: 'Concluído', color: 'bg-green-100 text-green-800' }
    }

    const getReturnStatus = (rental: any) => {
        if (rental.status === 'COMPLETED') return { label: 'Devolvido', color: 'bg-green-100 text-green-800' }
        if (rental.status === 'CANCELLED') return { label: 'Cancelado', color: 'bg-red-50 text-red-500' }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endDay = new Date(rental.endDate)
        endDay.setHours(0, 0, 0, 0)

        const diffDays = (endDay.getTime() - today.getTime()) / (1000 * 3600 * 24)

        if (diffDays < 0) return { label: 'Atrasado', color: 'bg-red-100 text-red-800 font-bold' }
        if (diffDays === 0) return { label: 'Coletar Hoje', color: 'bg-orange-100 text-orange-800 font-bold' }
        if (diffDays === 1) return { label: 'Coletar Amanhã', color: 'bg-yellow-100 text-yellow-800' }

        return { label: 'Planejado', color: 'bg-blue-50 text-blue-600' }
    }

    const getFinancialStatus = (rental: any) => {
        const total = rental.totalAmount
        const paid = rental.amountPaid || 0

        if (paid >= total) return { label: 'Pago', color: 'text-green-600 font-bold' }
        if (paid > 0) return { label: 'Parcial', color: 'text-orange-600 font-medium' }

        const isLate = getReturnStatus(rental).label === 'Atrasado'
        if (isLate) return { label: 'Inadimplente', color: 'text-red-600 font-bold' }

        return { label: 'Não Pago', color: 'text-gray-500' }
    }

    return (
        <div className="space-y-6">

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="flex flex-wrap gap-4 items-end">

                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Pesquisa (Nome, Tel, Doc)</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                className="input pl-9"
                                placeholder="Buscar cliente..."
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="w-40">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                        <select
                            className="input mt-1"
                            value={filters.type}
                            onChange={e => setFilters({ ...filters, type: e.target.value as any })}
                        >
                            <option value="ALL">Todos Tipos</option>
                            <option value="DAILY">Pontual</option>
                            <option value="MONTHLY">Mensal</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-48">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Situação</label>
                        <select
                            className="input mt-1"
                            value={filters.status}
                            onChange={e => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="active_only">Não Encerrados</option>
                            <option value="">Todos</option>
                            <option value="ACTIVE">Em Andamento</option>
                            <option value="SCHEDULED">Reservado</option>
                            <option value="LATE">Atrasados</option>
                            <option value="COMPLETED">Encerrados</option>
                        </select>
                    </div>

                    <div className="w-36">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Início De</label>
                        <input type="date" className="input mt-1" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Loading / Empty States */}
            {loading ? (
                <div className="text-center py-10"><div className="loader">Carregando locações...</div></div>
            ) : rentals.length === 0 ? (
                <div className="card p-10 text-center text-gray-500">
                    <Truck className="mx-auto mb-4 opacity-20" size={48} />
                    <p>Nenhuma locação encontrada com os filtros atuais.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b text-gray-600 font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Datas</th>
                                    <th className="px-4 py-3">Cliente / Contato</th>
                                    <th className="px-4 py-3">Endereço de Uso</th>
                                    <th className="px-4 py-3">Status Entrega/Devolução</th>
                                    <th className="px-4 py-3 text-right">Financeiro (Pago/Total)</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rentals.map(rental => {
                                    const delStatus = getDeliveryStatus(rental)
                                    const retStatus = getReturnStatus(rental)
                                    const finStatus = getFinancialStatus(rental)

                                    return (
                                        <tr key={rental.id} className="hover:bg-blue-50/30 transition-colors">
                                            {/* Date Info */}
                                            <td className="px-4 py-3 align-top whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1 font-medium text-gray-700">
                                                        <Calendar size={12} className="text-blue-500" />
                                                        {new Date(rental.startDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Clock size={12} />
                                                        Até {new Date(rental.endDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded w-fit">
                                                        {rental.type === 'MONTHLY' ? 'MENSAL' : 'PONTUAL'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Customer Info */}
                                            <td className="px-4 py-3 align-top">
                                                <p className="font-bold text-gray-900 line-clamp-1" title={rental.person.name}>{rental.person.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Phone size={12} /> {rental.person.phone}
                                                </div>
                                                {/* References - assuming we parse JSON or just show active contact */}
                                                {rental.person.references && Array.isArray(rental.person.references) && rental.person.references.length > 0 && (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        Ref: {(rental.person.references as any)[0].name}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Address */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex gap-1 items-start max-w-[200px]">
                                                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-gray-600 line-clamp-2">
                                                        {typeof rental.usageAddress === 'string' ? rental.usageAddress : // Legacy string check
                                                            rental.deliveryAddress || `${rental.person.street}, ${rental.person.number}, ${rental.person.neighborhood}`}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Logistics Status */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="space-y-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${delStatus.color}`}>
                                                        {delStatus.label}
                                                    </span>
                                                    <div className="block"></div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${retStatus.color}`}>
                                                        {retStatus.label}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Financials */}
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-gray-900">R$ {rental.totalAmount.toFixed(2)}</span>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Pago: <span className="text-green-600 font-medium">R$ {rental.amountPaid?.toFixed(2) || '0.00'}</span>
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-bold ${finStatus.color}`}>
                                                        {finStatus.label}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 align-middle text-right">
                                                <RentalActions rental={rental} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
