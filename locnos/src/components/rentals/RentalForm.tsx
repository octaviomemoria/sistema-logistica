'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Search, Plus, Trash2, Truck, User, Save, MapPin, Copy, Box, ImageIcon, AlertTriangle, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createRental, updateRental, updateRentalStatus, getDrivers, RentalInput, RentalItemInput } from '@/app/dashboard/rentals/actions'
import { getPersons } from '@/app/dashboard/persons/actions'
import { getEquipments } from '@/app/dashboard/inventory/actions'
import RentalOccurrenceModal from './RentalOccurrenceModal'
import RentalDriverModal from './RentalDriverModal'
import PaymentHistory from './PaymentHistory'
import PaymentRegistration from './PaymentRegistration'
import { addPayment } from '../../app/dashboard/rentals/payment-actions'

interface RentalFormProps {
    initialData?: any
}

export interface LocalPayment {
    id: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    notes?: string
}

export default function RentalForm({ initialData }: RentalFormProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [modalType, setModalType] = useState<'NONE' | 'OCCURRENCE' | 'DELIVERY' | 'RETURN'>('NONE')

    // Data Sources
    const [customers, setCustomers] = useState<any[]>([])
    const [equipments, setEquipments] = useState<any[]>([])
    const [drivers, setDrivers] = useState<any[]>([])

    // Defaults
    const getDefaultStart = () => {
        if (initialData?.startDate) return new Date(initialData.startDate).toISOString().slice(0, 16)
        const d = new Date()
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().slice(0, 16)
    }

    const getDefaultEnd = () => {
        if (initialData?.endDate) return new Date(initialData.endDate).toISOString().slice(0, 16)
        const d = new Date()
        d.setDate(d.getDate() + 3)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().slice(0, 16)
    }

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<string>(initialData?.personId || '')
    const [startDate, setStartDate] = useState<string>(getDefaultStart())
    const [endDate, setEndDate] = useState<string>(getDefaultEnd())
    const [deliveryAddress, setDeliveryAddress] = useState<string>(initialData?.deliveryAddress || '')
    const [rentalType, setRentalType] = useState<'DAILY' | 'MONTHLY'>(initialData?.type || 'DAILY')

    // Drivers
    const [deliveryDriverId, setDeliveryDriverId] = useState<string>(initialData?.deliveryDriverId || '')
    const [returnDriverId, setReturnDriverId] = useState<string>(initialData?.returnDriverId || '')

    const [items, setItems] = useState<RentalItemInput[]>(initialData?.items?.map((i: any) => ({
        equipmentId: i.equipmentId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        depositValue: i.depositValue || 0
    })) || [])
    const [searchTerm, setSearchTerm] = useState('')

    // Financials
    const [deliveryFee, setDeliveryFee] = useState(initialData?.deliveryFee || 0)
    const [returnFee, setReturnFee] = useState(initialData?.returnFee || 0)
    const [discount, setDiscount] = useState(initialData?.discount || 0)
    const [securityDeposit, setSecurityDeposit] = useState(initialData?.securityDeposit || 0)
    const [amountPaid, setAmountPaid] = useState(initialData?.amountPaid || 0)
    const [paymentMethod, setPaymentMethod] = useState<string>(initialData?.paymentMethod || '')

    // Local Payments (for new rentals before saving)
    const [localPayments, setLocalPayments] = useState<LocalPayment[]>([])
    const [paymentHistoryKey, setPaymentHistoryKey] = useState(0)

    // Load Data
    useEffect(() => {
        getPersons('ACTIVE').then(res => {
            if (res.success) setCustomers(res.persons || [])
        })
        getEquipments('AVAILABLE').then(res => {
            if (res.success) setEquipments(res.equipments || [])
        })
        getDrivers().then(res => {
            if (res.success) setDrivers(res.drivers || [])
        })
    }, [])

    // Helpers
    const getDurationDays = () => {
        if (!startDate || !endDate) return 1
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        return diff < 1 ? 1 : diff
    }

    const durationDays = getDurationDays()

    const addItem = (equipmentId: string) => {
        const item = equipments.find(e => e.id === equipmentId)
        if (!item) return

        const existing = items.find(i => i.equipmentId === equipmentId)
        if (existing) {
            const newItems = items.map(i => i.equipmentId === equipmentId ? { ...i, quantity: i.quantity + 1 } : i)
            setItems(newItems)
        } else {
            // Check for default rental period
            const defaultPeriod = (item.rentalPeriods as any[])?.find((p: any) => p.isDefault)
            const initialPrice = defaultPeriod ? defaultPeriod.price : (item.salePrice || 0)

            setItems([...items, {
                equipmentId: item.id,
                quantity: 1,
                unitPrice: initialPrice,
                depositValue: item.suggestedDeposit || 0
            }])
        }
        showToast('success', `${item.name} adicionado`)
    }

    const removeItem = (equipmentId: string) => {
        setItems(items.filter(i => i.equipmentId !== equipmentId))
    }

    const updateQuantity = (equipmentId: string, qty: number) => {
        if (qty < 1) return
        setItems(items.map(i => i.equipmentId === equipmentId ? { ...i, quantity: qty } : i))
    }

    const updatePrice = (equipmentId: string, price: number) => {
        setItems(items.map(i => i.equipmentId === equipmentId ? { ...i, unitPrice: price } : i))
    }

    const updateDeposit = (equipmentId: string, deposit: number) => {
        setItems(items.map(i => i.equipmentId === equipmentId ? { ...i, depositValue: deposit } : i))
    }

    const copyCustomerAddress = () => {
        const cust = customers.find(c => c.id === selectedCustomer)
        if (cust) {
            setDeliveryAddress(`${cust.street}, ${cust.number} - ${cust.neighborhood}, ${cust.city}`)
            showToast('success', 'Endereço copiado!')
        } else {
            showToast('error', 'Selecione um cliente primeiro')
        }
    }

    // Filter Equipments
    const filteredEquipments = equipments.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Calculations
    const itemsTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
    const totalContract = itemsTotal + deliveryFee + returnFee - discount

    // Local Payment Helpers
    const handleAddLocalPayment = (payment: LocalPayment) => {
        setLocalPayments([...localPayments, payment])
        setPaymentHistoryKey(prev => prev + 1) // Force re-render
        showToast('success', 'Pagamento adicionado! Será salvo ao criar a locação')
    }

    const handleDeleteLocalPayment = (id: string) => {
        setLocalPayments(localPayments.filter(p => p.id !== id))
        setPaymentHistoryKey(prev => prev + 1)
        showToast('info', 'Pagamento removido')
    }

    const handleSave = async (status: string) => {
        if (!selectedCustomer) return showToast('error', 'Selecione um cliente')
        if (!startDate || !endDate) return showToast('error', 'Selecione as datas')
        if (items.length === 0) return showToast('error', 'Adicione itens ao contrato')

        const data: RentalInput = {
            personId: selectedCustomer,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status,
            type: rentalType,
            items,
            deliveryFee,
            returnFee,
            discount,
            securityDeposit: items.reduce((acc, i) => acc + ((i.depositValue || 0) * i.quantity), 0),
            amountPaid,
            paymentMethod,
            deliveryAddress: deliveryAddress || undefined,
            deliveryDriverId: deliveryDriverId || undefined,
            returnDriverId: returnDriverId || undefined
        }

        let result
        if (initialData && initialData.id) {
            result = await updateRental(initialData.id, data)
        } else {
            result = await createRental(data)

            // Create local payments after rental is created
            if (result.success && result.rental && localPayments.length > 0) {
                console.log('🔵 Saving local payments:', localPayments)
                console.log('🔵 Rental ID:', result.rental.id)

                showToast('info', `Salvando ${localPayments.length} pagamento(s)...`)

                for (const payment of localPayments) {
                    console.log('🔵 Creating payment:', payment)
                    const paymentResult = await addPayment({
                        rentalId: result.rental.id,
                        amount: payment.amount,
                        paymentMethod: payment.paymentMethod,
                        paymentDate: payment.paymentDate,
                        notes: payment.notes
                    })
                    console.log('🔵 Payment result:', paymentResult)
                }

                console.log('✅ All payments saved')
            } else {
                console.log('⚠️ Payment save skipped:', {
                    success: result.success,
                    hasRental: !!result.rental,
                    localPaymentsCount: localPayments.length
                })
            }
        }

        if (result.success) {
            showToast('success', `Locação ${status === 'ACTIVE' ? (initialData ? 'atualizada' : 'criada') : 'salva'}!`)
            router.push('/dashboard/rentals')
        } else {
            showToast('error', result.error || 'Erro ao salvar locação')
        }
    }

    return (
        <div className="max-w-[1800px] mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 px-1">{initialData ? 'Editar Locação' : 'Nova Locação'}</h1>

            {/* Top Section: Customer & Config */}
            <div className="card p-5 border shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <User className="text-blue-600" />
                    <h2 className="text-lg font-bold">Dados do Contrato</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                        <label className="label">Cliente *</label>
                        <select
                            className="input"
                            value={selectedCustomer}
                            onChange={e => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="flex justify-between items-center mb-1">
                            <label className="label mb-0">Endereço de Uso</label>
                            <button onClick={copyCustomerAddress} className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                                <Copy size={12} /> Copiar Cadastro
                            </button>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                className="input pl-9"
                                value={deliveryAddress}
                                onChange={e => setDeliveryAddress(e.target.value)}
                                placeholder="Rua, Número, Bairro..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Tipo de Locação</label>
                        <select className="input" value={rentalType} onChange={e => setRentalType(e.target.value as any)}>
                            <option value="DAILY">Pontual (Diária)</option>
                            <option value="MONTHLY">Mensal</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">Data Início</label>
                        <input type="datetime-local" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    <div>
                        <label className="label">Devolução Prevista</label>
                        <input type="datetime-local" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Col: Equipment Picker (30% approx -> 4/12) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="card p-4 min-h-[600px] flex flex-col shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold flex items-center gap-2 text-gray-700">
                                <Search className="text-blue-600" size={18} /> Catálogo
                            </h2>
                            <div className="relative w-40">
                                <Search className="absolute left-2 top-2 text-gray-400" size={14} />
                                <input
                                    className="input pl-7 py-1 text-xs"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 overflow-y-auto flex-1 max-h-[600px] pr-1">
                            {filteredEquipments.map(e => (
                                <div key={e.id}
                                    className="border rounded-lg p-2 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex gap-3 group transition-all bg-white shadow-sm"
                                    onClick={() => addItem(e.id)}
                                >
                                    {/* Mini Image */}
                                    <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border">
                                        {e.imageUrl ? (
                                            <img src={e.imageUrl} alt={e.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={16} className="text-gray-300" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate text-gray-800 group-hover:text-blue-700">{e.name}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-gray-500">{e.brand}</span>
                                            <span className="text-xs font-medium text-green-600">R$ {e.salePrice?.toFixed(2)}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            Disp: {e.totalQty - e.rentedQty}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Plus size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Summary & Financials (70% approx -> 8/12) */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Blue Circle Area: Selected Items */}
                    <div className="card p-0 border overflow-hidden">
                        <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center gap-2">
                            <Truck className="text-blue-600" size={18} />
                            <h2 className="text-base font-bold text-gray-700">Resumo do Pedido</h2>
                            <span className="text-xs text-gray-500 ml-auto">{items.length} itens</span>
                        </div>

                        <div className="p-0 max-h-[400px] overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">
                                    <Box className="mx-auto mb-2 opacity-20" size={48} />
                                    <p>Nenhum item selecionado</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Descrição</th>
                                            <th className="px-2 py-2 text-center">Qtd.</th>
                                            <th className="px-2 py-2 text-right">Valor Unit.</th>
                                            <th className="px-2 py-2 text-right">Caução (Unit.)</th>
                                            <th className="px-2 py-2 text-center">Dias</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                            <th className="px-2 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map(item => {
                                            const eq = equipments.find(e => e.id === item.equipmentId)
                                            return (
                                                <tr key={item.equipmentId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 align-middle">
                                                        <p className="font-bold text-gray-800">{eq?.name}</p>
                                                        <p className="text-xs text-gray-500">{eq?.brand}</p>
                                                    </td>
                                                    <td className="px-2 py-3 align-middle text-center">
                                                        <input
                                                            type="number"
                                                            className="w-16 p-1 border rounded text-center outline-none focus:border-blue-500"
                                                            value={item.quantity}
                                                            onChange={e => updateQuantity(item.equipmentId, parseInt(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3 align-middle text-right">
                                                        <input
                                                            type="number"
                                                            className="w-20 p-1 border rounded text-right outline-none focus:border-blue-500"
                                                            value={item.unitPrice}
                                                            onChange={e => updatePrice(item.equipmentId, parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3 align-middle text-right">
                                                        <input
                                                            type="number"
                                                            className="w-20 p-1 border rounded text-right outline-none focus:border-blue-500 text-gray-500"
                                                            value={item.depositValue || 0}
                                                            onChange={e => updateDeposit(item.equipmentId, parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3 align-middle text-center text-gray-600">
                                                        {durationDays} dias
                                                    </td>
                                                    <td className="px-4 py-3 align-middle text-right font-bold text-gray-800">
                                                        R$ {(item.quantity * item.unitPrice).toFixed(2)}
                                                    </td>
                                                    <td className="px-2 py-3 align-middle text-center">
                                                        <button onClick={() => removeItem(item.equipmentId)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Green Square Area: Financials */}
                    <div className="card p-5 border-2 border-green-50 bg-green-50/20">
                        <div className="space-y-4">

                            {/* Subtotal */}
                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="font-medium text-gray-600">Subtotal</span>
                                <span className="font-bold text-lg text-gray-800">R$ {itemsTotal.toFixed(2)}</span>
                            </div>

                            {/* Logistics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-24">Frete Entrega</label>
                                        <input className="input-sm flex-1 text-right" type="number" value={deliveryFee} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-24">Freteiro</label>
                                        <select className="input-sm flex-1" value={deliveryDriverId} onChange={e => setDeliveryDriverId(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-24">Frete Devolução</label>
                                        <input className="input-sm flex-1 text-right" type="number" value={returnFee} onChange={e => setReturnFee(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-24">Freteiro</label>
                                        <select className="input-sm flex-1" value={returnDriverId} onChange={e => setReturnDriverId(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Discount & Total */}
                            <div className="flex justify-between items-center bg-white p-3 rounded border mt-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-green-700 font-medium">Desconto</label>
                                    <input className="w-24 input py-1 text-right text-green-700" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold text-gray-900">Total</span>
                                    <span className="text-3xl font-bold text-blue-600">R$ {totalContract.toFixed(2)}</span>
                                </div>
                            </div>


                            {/* Payment System */}
                            <div className="border-t pt-4 mt-4">
                                <PaymentHistory
                                    key={paymentHistoryKey}
                                    rentalId={initialData?.id}
                                    totalAmount={totalContract}
                                    localPayments={!initialData ? localPayments : undefined}
                                    onDeleteLocal={!initialData ? handleDeleteLocalPayment : undefined}
                                    refreshKey={paymentHistoryKey}
                                />
                                <PaymentRegistration
                                    rentalId={initialData?.id}
                                    onSuccess={() => {
                                        setPaymentHistoryKey(prev => prev + 1)
                                        router.refresh()
                                    }}
                                    onAddLocal={!initialData ? handleAddLocalPayment : undefined}
                                />
                            </div>

                            {/* Deposit field (always visible) */}
                            <div className="flex items-center gap-2 pt-2 border-t mt-4">
                                <label className="text-sm font-bold text-gray-700">Total Caução</label>
                                <input
                                    className="w-32 input py-1 text-right text-sm bg-gray-100"
                                    type="number"
                                    value={items.reduce((acc, i) => acc + ((i.depositValue || 0) * i.quantity), 0)}
                                    readOnly
                                />
                            </div>
                        </div>

                    </div>



                    {/* Action Bar */}
                    {!initialData ? (
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <button onClick={() => handleSave('DRAFT')} className="btn-secondary">Salvar Rascunho</button>
                            <button onClick={() => handleSave('SCHEDULED')} className="bg-yellow-100 text-yellow-700 py-2 rounded hover:bg-yellow-200 transition font-bold border border-yellow-200">Agendar Locação</button>
                            <button onClick={() => handleSave('ACTIVE')} className="btn-primary">Ativar Agora</button>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {/* Primary Save */}
                            <button onClick={() => handleSave(initialData.status)} className="w-full btn-primary h-12 text-lg">
                                <Save className="inline mr-2" /> Salvar Alterações
                            </button>

                            {/* Status Operations */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {/* Delivery Actions */}
                                {(initialData.status === 'DRAFT' || initialData.status === 'SCHEDULED') && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Confirmar saída/entrega?')) {
                                                await updateRentalStatus(initialData.id, 'ACTIVE')
                                                router.refresh()
                                                showToast('success', 'Status atualizado!')
                                            }
                                        }}
                                        className="bg-green-100 text-green-700 py-2 rounded font-bold border border-green-200 hover:bg-green-200"
                                    >
                                        <Truck className="inline mr-1" size={16} /> Confirmar Entrega
                                    </button>
                                )}

                                {(initialData.status === 'ACTIVE' || initialData.status === 'LATE') && (
                                    <>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Confirmar devolução total?')) {
                                                    await updateRentalStatus(initialData.id, 'COMPLETED')
                                                    router.refresh()
                                                    showToast('success', 'Devolvido com sucesso!')
                                                }
                                            }}
                                            className="bg-blue-100 text-blue-700 py-2 rounded font-bold border border-blue-200 hover:bg-blue-200"
                                        >
                                            <Box className="inline mr-1" size={16} /> Confirmar Devolução
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Desfazer entrega e voltar para Agendado?')) {
                                                    await updateRentalStatus(initialData.id, 'SCHEDULED')
                                                    router.refresh()
                                                    showToast('info', 'Revertido para Agendado')
                                                }
                                            }}
                                            className="btn-secondary text-xs"
                                        >
                                            Desfazer Entrega
                                        </button>
                                    </>
                                )}

                                {initialData.status === 'COMPLETED' && (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Reabrir locação (Voltar para Ativo)?')) {
                                                await updateRentalStatus(initialData.id, 'ACTIVE')
                                                router.refresh()
                                                showToast('info', 'Locação Reaberta')
                                            }
                                        }}
                                        className="btn-secondary text-xs"
                                    >
                                        Reabrir Locação
                                    </button>
                                )}
                            </div>

                            {/* Extra Actions */}
                            <div className="grid grid-cols-3 gap-2 border-t pt-3">
                                <button onClick={() => setModalType('DELIVERY')} className="p-2 bg-gray-50 border rounded text-xs font-bold text-gray-600 hover:bg-gray-100">
                                    <Truck size={14} className="inline mr-1" /> Rota Entrega
                                </button>
                                <button onClick={() => setModalType('RETURN')} className="p-2 bg-gray-50 border rounded text-xs font-bold text-gray-600 hover:bg-gray-100">
                                    <Truck size={14} className="inline mr-1 transform scale-x-[-1]" /> Rota Devolução
                                </button>
                                <button onClick={() => setModalType('OCCURRENCE')} className="p-2 bg-red-50 border border-red-100 rounded text-xs font-bold text-red-600 hover:bg-red-100">
                                    <AlertTriangle size={14} className="inline mr-1" /> Ocorrência
                                </button>
                                <a href={`/print/contracts/${initialData.id}`} target="_blank" className="p-2 bg-gray-800 border border-gray-900 rounded text-xs font-bold text-white hover:bg-gray-700 text-center flex items-center justify-center">
                                    <FileText size={14} className="inline mr-1" /> Imprimir
                                </a>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Modals */}
            {
                initialData && (
                    <>
                        <RentalOccurrenceModal
                            rentalId={initialData.id}
                            isOpen={modalType === 'OCCURRENCE'}
                            onClose={() => setModalType('NONE')}
                        />
                        <RentalDriverModal
                            rentalId={initialData.id}
                            role={modalType === 'DELIVERY' ? 'DELIVERY' : 'RETURN'}
                            isOpen={modalType === 'DELIVERY' || modalType === 'RETURN'}
                            onClose={() => setModalType('NONE')}
                            currentDriverId={modalType === 'DELIVERY' ? deliveryDriverId : returnDriverId}
                        />
                    </>
                )
            }
        </div >
    )
}
