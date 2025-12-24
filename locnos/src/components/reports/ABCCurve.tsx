'use client'

interface ABCItem {
    name: string
    revenue: number
    count: number
    category: string
    percentage: number
}

export default function ABCCurve({ data }: { data: ABCItem[] }) {
    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Curva ABC (Top 5 Receita)</h3>
            <div className="space-y-4">
                {data.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="relative">
                        <div className="flex justify-between items-end mb-1 text-sm">
                            <span className="font-medium text-gray-700">{item.name}</span>
                            <span className="font-bold text-gray-900">R$ {item.revenue.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full ${item.category === 'A' ? 'bg-green-500' :
                                        item.category === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${(item.revenue / data[0].revenue) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{item.count} locações</span>
                            <span className={`font-bold ${item.category === 'A' ? 'text-green-600' :
                                    item.category === 'B' ? 'text-yellow-600' : 'text-red-600'
                                }`}>Classe {item.category}</span>
                        </div>
                    </div>
                ))}

                {data.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sem dados suficientes</p>}
            </div>
        </div>
    )
}
