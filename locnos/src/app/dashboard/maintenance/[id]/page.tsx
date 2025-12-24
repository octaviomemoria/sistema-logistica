'use server'

import { prisma } from '@/lib/prisma'
import { completeMaintenance } from '../actions'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, Calendar, DollarSign, Wrench, AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function MaintenanceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const maintenance = await prisma.maintenance.findUnique({
        where: { id },
        include: { equipment: true }
    })

    if (!maintenance) return <div>Manutenção não encontrada</div>

    async function handleComplete(formData: FormData) {
        'use server'
        const finalCost = parseFloat(formData.get('cost') as string) || 0
        const notes = formData.get('notes') as string

        await completeMaintenance(id, new Date(), finalCost, notes)
        redirect('/dashboard/maintenance')
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Link href="/dashboard/maintenance" className="flex items-center text-gray-500 mb-6 hover:text-gray-800 w-fit">
                <ArrowLeft size={20} className="mr-2" /> Voltar à lista
            </Link>

            <div className="bg-white rounded-xl shadow border overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 px-8 py-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{maintenance.equipment.name}</h1>
                            <p className="text-gray-500">{maintenance.equipment.brand}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${maintenance.status === 'OPEN' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'
                            }`}>
                            {maintenance.status === 'OPEN' ? 'Em Andamento' : 'Concluído'}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Dados da Manutenção</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    {maintenance.type === 'CORRECTIVE' ? <AlertTriangle size={18} className="text-red-500" /> : <Clock size={18} className="text-blue-500" />}
                                    <span className="font-medium text-gray-700">{maintenance.type === 'CORRECTIVE' ? 'Corretiva' : 'Preventiva'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-gray-400" />
                                    <span className="text-gray-700">Início: {new Date(maintenance.startDate).toLocaleDateString()}</span>
                                </div>
                                {maintenance.endDate && (
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={18} className="text-green-500" />
                                        <span className="text-gray-700">Fim: {new Date(maintenance.endDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Descrição Inicial</h3>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border">{maintenance.description || 'Nenhuma descrição informada.'}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Custos</h3>
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                                <DollarSign size={24} className="text-green-600" />
                                R$ {maintenance.cost?.toFixed(2)}
                            </div>
                        </div>

                        {maintenance.status === 'OPEN' && (
                            <div className="mt-8 pt-8 border-t">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Finalizar Manutenção</h3>
                                <form action={handleComplete} className="space-y-4">
                                    <div>
                                        <label className="label">Custo Final</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                                            <input
                                                name="cost"
                                                type="number"
                                                step="0.01"
                                                defaultValue={maintenance.cost}
                                                className="input pl-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Observações de Conclusão (Opcional)</label>
                                        <textarea
                                            name="notes"
                                            className="input min-h-[80px]"
                                            placeholder="O que foi feito..."
                                        />
                                    </div>
                                    <button type="submit" className="w-full btn-primary bg-green-600 hover:bg-green-700 flex justify-center items-center gap-2">
                                        <CheckCircle size={20} /> Concluir Manutenção
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
