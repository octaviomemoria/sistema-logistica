'use client'

import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react'

interface FinancialData {
    totalRevenue: number
    totalPaid: number
    pendingAmount: number
    count: number
    revenueHistory: { name: string, value: number }[]
}

export default function FinancialSummary({ data }: { data: FinancialData }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Faturamento Total</p>
                        <h3 className="text-2xl font-bold text-gray-900">R$ {data.totalRevenue.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                    Baseado em {data.count} locações
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Recebido</p>
                        <h3 className="text-2xl font-bold text-green-700">R$ {data.totalPaid.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(data.totalPaid / (data.totalRevenue || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-green-600">{Math.round((data.totalPaid / (data.totalRevenue || 1)) * 100)}%</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-red-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">A Receber / Pendente</p>
                        <h3 className="text-2xl font-bold text-red-700">R$ {data.pendingAmount.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <AlertCircle size={20} />
                    </div>
                </div>
                <div className="mt-4 text-xs text-red-400 font-medium">
                    Atenção a inadimplência
                </div>
            </div>
        </div>
    )
}
