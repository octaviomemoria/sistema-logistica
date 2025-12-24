'use server'

import { getAvailabilityData } from './actions'
import { CalendarDays, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function AvailabilityReportPage(props: {
    searchParams: SearchParams
}) {
    const searchParams = await props.searchParams
    const startDateStr = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined
    const { matrix, rentalDetails, dates, formattedDatesMd } = await getAvailabilityData(startDateStr)

    const startDate = startDateStr ? new Date(startDateStr) : new Date()

    const prevDate = format(subDays(startDate, 15), 'yyyy-MM-dd')
    const nextDate = format(addDays(startDate, 15), 'yyyy-MM-dd')

    return (
        <div className="p-8 max-w-[1800px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/reports"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <CalendarDays className="text-blue-600" size={32} />
                            Disponibilidade de Equipamentos
                        </h1>
                        <p className="text-gray-500 mt-1">Visualize o estoque futuro considerando locações agendadas</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Link
                        href={`?startDate=${prevDate}`}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
                        title="15 dias anteriores"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="px-4 font-medium text-gray-700 min-w-[140px] text-center">
                        {formattedDatesMd[0].day}/{formattedDatesMd[0].month} - {formattedDatesMd[formattedDatesMd.length - 1].day}/{formattedDatesMd[formattedDatesMd.length - 1].month}
                    </span>
                    <Link
                        href={`?startDate=${nextDate}`}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
                        title="Próximos 15 dias"
                    >
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-gray-50 border-r min-w-[200px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    Equipamento / Data
                                </th>
                                {formattedDatesMd.map((d, i) => (
                                    <th key={dates[i]} className="px-2 py-3 font-medium text-gray-700 text-center min-w-[60px] border-r last:border-r-0">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold">{d.day}</span>
                                            <span className="text-xs uppercase text-gray-500">{d.month}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {Object.values(matrix).map((item) => (
                                <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white border-r z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <span className="text-xs text-gray-400 font-normal">Total: {item.totalQty}</span>
                                        </div>
                                    </td>
                                    {item.dailyAvailability.map((available, i) => {
                                        let bgColor = ''
                                        let textColor = 'text-gray-900'

                                        if (available < 0) {
                                            bgColor = 'bg-red-100'
                                            textColor = 'text-red-700 font-bold'
                                        } else if (available === 0) {
                                            bgColor = 'bg-orange-50'
                                            textColor = 'text-orange-600 font-medium'
                                        }

                                        return (
                                            <td key={i} className={`px-2 py-3 text-center border-r last:border-r-0 ${bgColor}`}>
                                                <span className={textColor}>{available}</span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rental Details */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Detalhamento de Locações no Período</h2>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Objeto</th>
                                    <th className="px-6 py-3">Quantidade</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Início</th>
                                    <th className="px-6 py-3">Fim</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rentalDetails.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                            Nenhuma locação ativa neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    rentalDetails.map((rental, index) => (
                                        <tr key={`${rental.id}-${rental.equipmentName}-${index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{rental.equipmentName}</td>
                                            <td className="px-6 py-4">{rental.quantity}</td>
                                            <td className="px-6 py-4">{rental.personName}</td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {format(rental.startDate, "dd 'de' MMM", { locale: ptBR })}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {format(rental.endDate, "dd 'de' MMM", { locale: ptBR })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/dashboard/rentals/${rental.id}`}
                                                    className="text-blue-600 hover:underline font-medium"
                                                >
                                                    Ver Locação
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
