import { getDriverStats } from '../actions'
import { User, Medal, Route, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface DriverStat {
    id: string
    name: string
    email: string
    completedRoutes: number
    completedStops: number
    avgStops: string
}

export default async function DriversReportPage() {
    const drivers: DriverStat[] = await getDriverStats()

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-blue-600" />
                        Performance de Motoristas
                    </h1>
                    <p className="text-gray-500 text-sm">Análise de produtividade e eficiência</p>
                </div>
                <Link href="/dashboard/reports" className="text-sm font-bold text-gray-500 hover:text-gray-800">
                    &larr; Voltar para Relatórios
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-bold text-gray-600 text-sm">Motorista</th>
                            <th className="p-4 font-bold text-gray-600 text-sm text-center">Rotas Completas</th>
                            <th className="p-4 font-bold text-gray-600 text-sm text-center">Entregas/Coletas</th>
                            <th className="p-4 font-bold text-gray-600 text-sm text-center">Média Paradas/Rota</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {drivers.map((driver, index) => (
                            <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-600'
                                            }`}>
                                            {index < 3 ? <Medal size={16} /> : <User size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{driver.name}</p>
                                            <p className="text-xs text-gray-400">{driver.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1 font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                                        <Route size={14} />
                                        {driver.completedRoutes}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1 font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full">
                                        <CheckCircle size={14} />
                                        {driver.completedStops}
                                    </div>
                                </td>
                                <td className="p-4 text-center font-mono text-gray-600">
                                    {driver.avgStops}
                                </td>
                            </tr>
                        ))}

                        {drivers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    Nenhum dado de percurso encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
