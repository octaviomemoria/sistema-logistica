'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEquipment, updateEquipment, EquipmentInput, RentalPeriod, Specification } from '@/app/dashboard/inventory/actions'
import { Plus, Trash2, Save, X, ImageIcon, UploadCloud, Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EquipmentFormProps {
    initialData?: EquipmentInput & { id?: string }
    isEditing?: boolean
}

export default function EquipmentForm({ initialData, isEditing = false }: EquipmentFormProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)

    // Base State
    const [formData, setFormData] = useState<EquipmentInput>({
        name: initialData?.name || '',
        category: initialData?.category || '',
        subCategory: initialData?.subCategory || '',
        brand: initialData?.brand || '',
        description: initialData?.description || '',
        purchasePrice: initialData?.purchasePrice || 0,
        salePrice: initialData?.salePrice || 0,
        suggestedDeposit: initialData?.suggestedDeposit || 0,
        replacementValue: initialData?.replacementValue || 0,
        totalQty: initialData?.totalQty || 1,
        rentedQty: initialData?.rentedQty || 0,
        imageUrl: initialData?.imageUrl || '',
        // Default at least one rental period
        rentalPeriods: initialData?.rentalPeriods?.length ? initialData.rentalPeriods : [{ description: 'Diária', days: 1, price: 0 }],
        specifications: initialData?.specifications?.length ? initialData.specifications : [{ key: '', value: '' }],
        externalLinks: initialData?.externalLinks?.length ? initialData.externalLinks : ['']
    })

    // Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    // Dynamic Fields Handlers
    const addRentalPeriod = () => {
        setFormData(prev => ({
            ...prev,
            rentalPeriods: [...prev.rentalPeriods, { description: '', days: 1, price: 0 }]
        }))
    }

    const removeRentalPeriod = (index: number) => {
        if (formData.rentalPeriods.length === 1) {
            showToast('error', 'É necessário pelo menos um período de locação.')
            return
        }
        setFormData(prev => ({
            ...prev,
            rentalPeriods: prev.rentalPeriods.filter((_, i) => i !== index)
        }))
    }

    const updateRentalPeriod = (index: number, field: keyof RentalPeriod, value: any) => {
        const newPeriods = [...formData.rentalPeriods]
        newPeriods[index] = { ...newPeriods[index], [field]: value }
        setFormData(prev => ({ ...prev, rentalPeriods: newPeriods }))
    }

    const setDefaultPeriod = (index: number) => {
        const newPeriods = formData.rentalPeriods.map((p, i) => ({
            ...p,
            isDefault: i === index
        }))
        setFormData(prev => ({ ...prev, rentalPeriods: newPeriods }))
    }

    const addSpec = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: '', value: '' }]
        }))
    }

    const removeSpec = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }))
    }

    const updateSpec = (index: number, field: keyof Specification, value: string) => {
        const newSpecs = [...formData.specifications]
        newSpecs[index] = { ...newSpecs[index], [field]: value }
        setFormData(prev => ({ ...prev, specifications: newSpecs }))
    }

    const updateLink = (index: number, value: string) => {
        const newLinks = [...formData.externalLinks]
        newLinks[index] = value
        setFormData(prev => ({ ...prev, externalLinks: newLinks }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (formData.totalQty < 0 || formData.purchasePrice < 0) {
            showToast('error', 'Valores monetários e quantidades devem ser positivos.')
            setLoading(false)
            return
        }

        try {
            // Clean up empty dynamic fields
            const cleanData = {
                ...formData,
                specifications: formData.specifications.filter(s => s.key && s.value),
                externalLinks: formData.externalLinks.filter(l => l)
            }

            const result = isEditing && initialData?.id
                ? await updateEquipment(initialData.id, cleanData)
                : await createEquipment(cleanData)

            if (result.success) {
                showToast('success', `Equipamento ${isEditing ? 'atualizado' : 'criado'} com sucesso!`)
                router.push('/dashboard/inventory')
            } else {
                showToast('error', result.error || 'Erro ao salvar')
            }
        } catch (error) {
            showToast('error', 'Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* Top Section: Image & Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Image Upload */}
                <div className="card p-6 h-fit">
                    <h3 className="text-lg font-semibold mb-4">Imagem do Equipamento</h3>
                    <div className="relative group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors cursor-pointer">
                        {formData.imageUrl ? (
                            <>
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                <ImageIcon className="mx-auto mb-2" size={48} />
                                <span className="text-sm">Clique para upload</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>

                {/* Right: Basic Fields */}
                <div className="lg:col-span-2 card p-6 space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Informações Principais</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Nome do Equipamento *</label>
                            <input
                                required
                                className="input"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Betoneira 400L"
                            />
                        </div>

                        <div>
                            <label className="label">Categoria *</label>
                            <input
                                required
                                className="input"
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                placeholder="Ex: Construção Civil"
                            />
                        </div>

                        <div>
                            <label className="label">Subcategoria</label>
                            <input
                                className="input"
                                value={formData.subCategory}
                                onChange={e => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                                placeholder="Ex: Betoneiras"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="label">Marca</label>
                            <input
                                className="input"
                                value={formData.brand}
                                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                                placeholder="Ex: CSM"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="label">Descrição Detalhada</label>
                            <textarea
                                className="input min-h-[100px]"
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descreva as características principais..."
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold border-b pb-2 pt-4">Estoque & Financeiro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Qtd. Total *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="input"
                                value={formData.totalQty}
                                onChange={e => setFormData(prev => ({ ...prev, totalQty: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <label className="label">Valor de Compra (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.purchasePrice}
                                onChange={e => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <label className="label">Caução Sugerida (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.suggestedDeposit}
                                onChange={e => setFormData(prev => ({ ...prev, suggestedDeposit: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <label className="label">Valor Reposição (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.replacementValue}
                                onChange={e => setFormData(prev => ({ ...prev, replacementValue: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Rental Periods */}
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Períodos de Locação</h3>
                        <button type="button" onClick={addRentalPeriod} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                            <Plus size={16} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.rentalPeriods.map((period, index) => (
                            <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-md">
                                <div className="flex-1">
                                    <input
                                        placeholder="Descrição (ex: Diária)"
                                        className="input text-sm mb-1"
                                        value={period.description}
                                        onChange={e => updateRentalPeriod(index, 'description', e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Dias</label>
                                            <input type="number" className="input text-sm" placeholder="Ex: 1" value={period.days} onChange={e => updateRentalPeriod(index, 'days', parseFloat(e.target.value))} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Valor (R$)</label>
                                            <input type="number" className="input text-sm" placeholder="Ex: 150.00" value={period.price} onChange={e => updateRentalPeriod(index, 'price', parseFloat(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDefaultPeriod(index)}
                                        className={`p-2 rounded hover:bg-yellow-50 transition-colors ${period.isDefault ? 'text-yellow-500' : 'text-gray-300'}`}
                                        title={period.isDefault ? 'Período Padrão' : 'Definir como Padrão'}
                                    >
                                        <Star size={16} fill={period.isDefault ? "currentColor" : "none"} />
                                    </button>
                                    <button type="button" onClick={() => removeRentalPeriod(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Specifications */}
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Especificações Técnicas</h3>
                        <button type="button" onClick={addSpec} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                            <Plus size={16} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.specifications.map((spec, index) => (
                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md">
                                <input
                                    className="input text-sm flex-1"
                                    placeholder="Chave (ex: Tensão)"
                                    value={spec.key}
                                    onChange={e => updateSpec(index, 'key', e.target.value)}
                                />
                                <input
                                    className="input text-sm flex-1"
                                    placeholder="Valor (ex: 220V)"
                                    value={spec.value}
                                    onChange={e => updateSpec(index, 'value', e.target.value)}
                                />
                                <button type="button" onClick={() => removeSpec(index)} className="text-red-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                >
                    {loading ? 'Salvando...' : (
                        <>
                            <Save size={18} />
                            {isEditing ? 'Atualizar Equipamento' : 'Cadastrar Equipamento'}
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
