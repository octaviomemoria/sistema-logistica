'use server'

import { getMaintenances } from './actions'
import Link from 'next/link'
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default async function MaintenancePage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string }>
}) {
    const params = await searchParams
    const filter = (params?.filter as any) || 'OPEN'
    const { maintenances } = await getMaintenances(filter)

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Wrench className="text-orange-600" /> Manutenção
                    </h1>
                    <p className="text-gray-500 text-sm">Gerencie equipamentos em reparo ou manutenção preventiva</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-lg border p-1">
                        <Link
                            href="/dashboard/maintenance?filter=OPEN"
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Em Aberto
                        </Link>
                        <Link
                            href="/dashboard/maintenance?filter=COMPLETED"
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Concluídos
                        </Link>
                        <Link
                            href="/dashboard/maintenance?filter=ALL"
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Todos
                        </Link>
                    </div>
                    <Link href="/dashboard/maintenance/new" className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Nova Manutenção
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Equipamento</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Tipo</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Data Início</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Custo</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {maintenances?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Nenhuma manutenção encontrada.
                                    </td>
                                </tr>
                            ) : (
                                maintenances?.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{m.equipment.name}</div>
                                            <div className="text-xs text-gray-500">{m.description || 'Sem descrição'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.type === 'CORRECTIVE' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {m.type === 'CORRECTIVE' ? <AlertTriangle size={10} /> : <Clock size={10} />}
                                                {m.type === 'CORRECTIVE' ? 'Corretiva' : 'Preventiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(m.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            R$ {m.cost.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {m.status === 'OPEN' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                    <Clock size={12} /> Em Andamento
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle size={12} /> Concluído
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/dashboard/maintenance/${m.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                Detalhes
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
    )
}
