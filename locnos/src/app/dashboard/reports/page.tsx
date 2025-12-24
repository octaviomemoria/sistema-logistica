'use server'

import ABCCurve from '@/components/reports/ABCCurve'
import FinancialSummary from '@/components/reports/FinancialSummary'
import { getFinancialStats, getInventoryStats, getABCAnalysis } from './actions'
import { BarChart3, CalendarDays, User } from 'lucide-react'

export default async function ReportsPage() {
    const financial = await getFinancialStats()
    const inventory = await getInventoryStats()
    const abc = await getABCAnalysis()

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Relatórios Gerenciais
            </h1>

            {/* Financial Section */}
            <FinancialSummary data={financial} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inventory Overview */}
                <div className="space-y-6">
                    <h3 className="font-bold text-gray-700 text-lg">Visão Geral de Estoque</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-gray-500 text-xs uppercase mb-1">Valor em Ativos</p>
                            <p className="text-xl font-bold text-gray-900">R$ {inventory.totalValue ? inventory.totalValue.toLocaleString('pt-BR') : '0,00'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <p className="text-gray-500 text-xs uppercase mb-1">Itens Alugados</p>
                            <p className="text-xl font-bold text-blue-600">{inventory.rentedItems} / {inventory.totalItems}</p>
                        </div>
                    </div>

                    {/* Navigation Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        <a href="/dashboard/reports/availability" className="block p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700 group-hover:bg-indigo-200 transition-colors">
                                    <CalendarDays size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Mapa de Disponibilidade</h3>
                                    <p className="text-xs text-gray-500">Cronograma visual de locações</p>
                                </div>
                            </div>
                        </a>

                        <a href="/dashboard/reports/drivers" className="block p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg text-green-700 group-hover:bg-green-200 transition-colors">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">Performance Motoristas</h3>
                                    <p className="text-xs text-gray-500">Ranking de entregas e eficiência</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Pareto Chart */}
                <ABCCurve data={abc.params} />
            </div>

            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 text-center text-blue-800">
                <p>Relatórios detalhados de Inadimplência e Curva ABC de produtos em breve.</p>
            </div>
        </div>
    )
}
