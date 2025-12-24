import Link from 'next/link'
import { getDashboardStats } from './actions'
import StatsCard from '@/components/dashboard/StatsCard'
import { Package, Truck, Calendar, Users, Plus, TrendingUp, Activity, Box, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Visão geral da Locadora</p>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ações Rápidas</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/rentals/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2} />
                        Nova Locação
                    </Link>
                    <Link
                        href="/dashboard/persons"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <Users size={18} strokeWidth={2} />
                        Pessoas
                    </Link>
                    <Link
                        href="/dashboard/inventory"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <Box size={18} strokeWidth={2} />
                        Inventário
                    </Link>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Locações Ativas"
                    value={stats.activeRentals}
                    icon={Package}
                    color="blue"
                    subtitle="Contratos em andamento"
                />
                <StatsCard
                    title="Agendamentos"
                    value={stats.scheduledRentals}
                    icon={Calendar}
                    color="yellow"
                    subtitle="Futuras entregas"
                />
                <StatsCard
                    title="Receita (Total)"
                    value={`R$ ${(stats.financial as any)?.totalRevenue?.toFixed(0) || '0'}`}
                    icon={DollarSign}
                    color="green"
                    subtitle={`Recebido: R$ ${(stats.financial as any)?.totalPaid?.toFixed(0) || '0'}`}
                />
                <StatsCard
                    title="Equipamentos Locados"
                    value={`${stats.rentedStock}/${stats.totalStock}`}
                    icon={Truck}
                    color="green"
                    subtitle="Utilização do estoque"
                />
                <StatsCard
                    title="Pessoas Ativas"
                    value={stats.totalCustomers}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Desempenho</h3>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp size={20} className="text-green-600" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Taxa de Utilização (Estoque)</span>
                            <span className="text-xl font-bold text-gray-900">
                                {stats.totalStock > 0
                                    ? Math.round((stats.rentedStock / stats.totalStock) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Disponibilidade</span>
                            <span className="text-xl font-bold text-gray-900">
                                {stats.availableStock} itens
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Activity size={20} className="text-blue-600" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">Lógica Refatorada</p>
                                <p className="text-xs text-gray-500 mt-0.5">Painel atualizado para Locadoras</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{stats.activeRentals} contratos ativos</p>
                                <p className="text-xs text-gray-500 mt-0.5">Operação em andamento</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
