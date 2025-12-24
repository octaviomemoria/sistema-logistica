'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPerson, updatePerson, getPersonTypes, createPersonType } from '@/app/dashboard/persons/actions'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatCNPJ, formatPhone, formatCEP, validateCPF, validateCNPJ } from '@/lib/utils'
import { Loader2, Upload, X, Plus, Trash2, CheckCircle, Search, Tag, } from 'lucide-react'

// Types
interface Reference {
    name: string
    phone: string
    relation: string
}

interface PersonType {
    id: string
    name: string
    color: string
    system: boolean
}

interface PersonFormProps {
    initialData?: any
    isEditing?: boolean
}

export default function PersonForm({ initialData, isEditing = false }: PersonFormProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [searchingCep, setSearchingCep] = useState(false)
    const [personTypes, setPersonTypes] = useState<PersonType[]>([])
    const [showNewTypeModal, setShowNewTypeModal] = useState(false)
    const [newTypeName, setNewTypeName] = useState('')
    const [newTypeColor, setNewTypeColor] = useState('#3B82F6')

    // Extract personTypeIds from initialData
    const initialPersonTypeIds = initialData?.personTypes?.map((pt: any) => pt.personType.id) || []

    const [formData, setFormData] = useState({
        type: initialData?.type || 'PF',
        name: initialData?.name || '',
        tradeName: initialData?.tradeName || '',
        document: initialData?.document || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        zipCode: initialData?.zipCode || '',
        street: initialData?.street || '',
        number: initialData?.number || '',
        complement: initialData?.complement || '',
        neighborhood: initialData?.neighborhood || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        active: initialData?.active ?? true,
        personTypeIds: initialPersonTypeIds,
        references: (initialData?.references as Reference[]) || [
            { name: '', phone: '', relation: '' },
            { name: '', phone: '', relation: '' }
        ]
    })

    const [files, setFiles] = useState<File[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Load person types on mount
    useEffect(() => {
        loadPersonTypes()
    }, [])

    const loadPersonTypes = async () => {
        const result = await getPersonTypes()
        if (result.success) {
            setPersonTypes(result.personTypes as PersonType[])
        }
    }

    const togglePersonType = (typeId: string) => {
        setFormData(prev => ({
            ...prev,
            personTypeIds: prev.personTypeIds.includes(typeId)
                ? prev.personTypeIds.filter(id => id !== typeId)
                : [...prev.personTypeIds, typeId]
        }))
    }

    const handleCreatePersonType = async () => {
        if (!newTypeName.trim()) {
            showToast('error', 'Digite um nome para o tipo')
            return
        }

        const result = await createPersonType(newTypeName, newTypeColor)
        if (result.success) {
            showToast('success', 'Tipo criado com sucesso!')
            setNewTypeName('')
            setNewTypeColor('#3B82F6')
            setShowNewTypeModal(false)
            await loadPersonTypes()
            // Auto-select the new type
            if (result.personType) {
                setFormData(prev => ({
                    ...prev,
                    personTypeIds: [...prev.personTypeIds, result.personType.id]
                }))
            }
        } else {
            showToast('error', result.error || 'Erro ao criar tipo')
        }
    }

    const handleReferencesChange = (index: number, field: keyof Reference, value: string) => {
        const newReferences = [...formData.references]
        newReferences[index][field] = value
        setFormData(prev => ({ ...prev, references: newReferences }))
    }

    const addReference = () => {
        setFormData(prev => ({
            ...prev,
            references: [...prev.references, { name: '', phone: '', relation: '' }]
        }))
    }

    const removeReference = (index: number) => {
        if (formData.references.length <= 2) {
            showToast('error', 'Mínimo de 2 referências obrigatórias')
            return
        }
        setFormData(prev => ({
            ...prev,
            references: prev.references.filter((_, i) => i !== index)
        }))
    }

    const searchCep = async () => {
        const cep = formData.zipCode.replace(/\D/g, '')
        if (cep.length !== 8) return

        setSearchingCep(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }))
                setErrors(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }))
            } else {
                showToast('error', 'CEP não encontrado')
            }
        } catch (error) {
            showToast('error', 'Erro ao buscar CEP')
        }
        setSearchingCep(false)
    }

    const handleDocumentBlur = () => {
        if (!formData.document) return

        const isValid = formData.type === 'PF'
            ? validateCPF(formData.document)
            : validateCNPJ(formData.document)

        if (!isValid) {
            setErrors(prev => ({
                ...prev,
                document: `${formData.type === 'PF' ? 'CPF' : 'CNPJ'} inválido. Verifique os dígitos.`
            }))
            showToast('error', `${formData.type === 'PF' ? 'CPF' : 'CNPJ'} inválido`)
        } else {
            setErrors(prev => {
                const { document, ...rest } = prev
                return rest
            })
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            const validFiles = newFiles.filter(file => {
                const isValidType = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
                if (!isValidType) {
                    showToast('error', `Arquivo ${file.name} inválido. Apenas PDF e imagens.`)
                }
                return isValidType
            })
            setFiles(prev => [...prev, ...validFiles])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name) newErrors.name = 'Nome é obrigatório'
        if (!formData.document) {
            newErrors.document = 'Documento é obrigatório'
        } else {
            const isValid = formData.type === 'PF'
                ? validateCPF(formData.document)
                : validateCNPJ(formData.document)

            if (!isValid) newErrors.document = `${formData.type === 'PF' ? 'CPF' : 'CNPJ'} inválido`
        }

        if (!formData.phone) newErrors.phone = 'Telefone é obrigatório'
        if (!formData.zipCode) newErrors.zipCode = 'CEP é obrigatório'
        if (!formData.street) newErrors.street = 'Rua é obrigatória'
        if (!formData.number) newErrors.number = 'Número é obrigatório'
        if (!formData.city) newErrors.city = 'Cidade é obrigatória'
        if (!formData.state) newErrors.state = 'Estado é obrigatório'

        // Type validation
        if (formData.personTypeIds.length === 0) {
            newErrors.personTypeIds = 'Selecione pelo menos um tipo'
        }

        // References validation
        const emptyRefs = formData.references.some(r => !r.name || !r.phone)
        if (emptyRefs) newErrors.references = 'Preencha todas as referências obrigatórias'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            showToast('error', 'Corrija os erros no formulário')
            return
        }

        setLoading(true)

        try {
            // Convert files to base64
            const documentPromises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
            })

            const base64Files = await Promise.all(documentPromises)

            const submitData = {
                ...formData,
                documents: base64Files
            }

            const result = isEditing && initialData?.id
                ? await updatePerson(initialData.id, submitData)
                : await createPerson(submitData)

            if (result.success) {
                showToast('success', `Pessoa ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`)
                router.push('/dashboard/persons')
            } else {
                showToast('error', result.error || 'Erro ao salvar pessoa')
            }
        } catch (error) {
            showToast('error', 'Erro inesperado')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const predefinedColors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#EF4444', // Red
        '#6366F1', // Indigo
    ]

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Person Types Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Classificação</h2>
                        <p className="text-sm text-gray-500">Selecione uma ou mais classificações para esta pessoa</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowNewTypeModal(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} /> Novo Tipo
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {personTypes.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => togglePersonType(type.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${formData.personTypeIds.includes(type.id)
                                ? 'text-white shadow-md'
                                : 'bg-opacity-10 border-2 hover:bg-opacity-20'
                                }`}
                            style={{
                                backgroundColor: formData.personTypeIds.includes(type.id) ? type.color : `${type.color}20`,
                                borderColor: type.color,
                                color: formData.personTypeIds.includes(type.id) ? 'white' : type.color
                            }}
                        >
                            {formData.personTypeIds.includes(type.id) && <CheckCircle size={16} />}
                            {type.name}
                        </button>
                    ))}
                </div>
                {errors.personTypeIds && <p className="text-red-500 text-sm mt-2">{errors.personTypeIds}</p>}
            </div>

            {/* Modal for Creating New Type */}
            {showNewTypeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Tag size={20} className="text-blue-600" />
                                Criar Novo Tipo
                            </h3>
                            <button
                                onClick={() => setShowNewTypeModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Nome do Tipo</label>
                                <input
                                    type="text"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    className="input"
                                    placeholder="Ex: Consultor, Representante"
                                />
                            </div>

                            <div>
                                <label className="label">Cor</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {predefinedColors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewTypeColor(color)}
                                            className={`w-10 h-10 rounded-lg transition-all ${newTypeColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={newTypeColor}
                                    onChange={(e) => setNewTypeColor(e.target.value)}
                                    className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTypeModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreatePersonType}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Criar Tipo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of the form - Status & Type Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Dados Principais</h2>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'PF' }))}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'PF' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Pessoa Física
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, type: 'PJ' }))}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${formData.type === 'PJ' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Pessoa Jurídica
                            </button>
                        </div>

                        {isEditing && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm font-medium text-gray-700">Ativo</span>
                                <div className="relative inline-block w-11 h-6 transition duration-200 ease-in-out">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <label className="label">Nome {formData.type === 'PJ' ? 'Razão Social' : 'Completo'} *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={`input ${errors.name ? 'border-red-500' : ''}`}
                            placeholder={formData.type === 'PJ' ? 'Empresa LTDA' : 'João da Silva'}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {formData.type === 'PJ' && (
                        <div>
                            <label className="label">Nome Fantasia</label>
                            <input
                                type="text"
                                value={formData.tradeName}
                                onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                                className="input"
                                placeholder="Nome comercial"
                            />
                        </div>
                    )}

                    <div>
                        <label className="label">{formData.type === 'PF' ? 'CPF' : 'CNPJ'} *</label>
                        <input
                            required
                            type="text"
                            value={formData.document}
                            onChange={(e) => {
                                const val = formData.type === 'PF' ? formatCPF(e.target.value) : formatCNPJ(e.target.value)
                                setFormData(prev => ({ ...prev, document: val }))
                                if (errors.document) {
                                    setErrors(prev => {
                                        const { document, ...rest } = prev
                                        return rest
                                    })
                                }
                            }}
                            onBlur={handleDocumentBlur}
                            className={`input ${errors.document ? 'border-red-500' : ''}`}
                            placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                            maxLength={formData.type === 'PF' ? 14 : 18}
                        />
                        {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document}</p>}
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Contato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="input"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="label">Telefone / Celular *</label>
                        <input
                            required
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                            className={`input ${errors.phone ? 'border-red-500' : ''}`}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Endereço</h2>
                    {searchingCep && (
                        <span className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 size={16} className="animate-spin" /> Buscando CEP...
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="label">CEP *</label>
                        <div className="relative">
                            <input
                                required
                                type="text"
                                value={formData.zipCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatCEP(e.target.value) }))}
                                onBlur={searchCep}
                                className={`input ${errors.zipCode ? 'border-red-500' : ''}`}
                                placeholder="00000-000"
                                maxLength={9}
                            />
                            <button
                                type="button"
                                onClick={searchCep}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Buscar CEP"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                        {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="label">Rua *</label>
                        <input
                            required
                            type="text"
                            value={formData.street}
                            onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                            className={`input ${errors.street ? 'border-red-500' : ''}`}
                        />
                        {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>

                    <div>
                        <label className="label">Número *</label>
                        <input
                            required
                            type="text"
                            value={formData.number}
                            onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                            className={`input ${errors.number ? 'border-red-500' : ''}`}
                        />
                        {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                    </div>

                    <div>
                        <label className="label">Complemento</label>
                        <input
                            type="text"
                            value={formData.complement}
                            onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                            className="input"
                            placeholder="Apto, Sala, etc."
                        />
                    </div>

                    <div>
                        <label className="label">Bairro</label>
                        <input
                            type="text"
                            value={formData.neighborhood}
                            onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Cidade *</label>
                        <input
                            required
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            className={`input ${errors.city ? 'border-red-500' : ''}`}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                        <label className="label">Estado *</label>
                        <select
                            required
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            className={`input ${errors.state ? 'border-red-500' : ''}`}
                        >
                            <option value="">UF</option>
                            <option value="AC">AC</option>
                            <option value="AL">AL</option>
                            <option value="AP">AP</option>
                            <option value="AM">AM</option>
                            <option value="BA">BA</option>
                            <option value="CE">CE</option>
                            <option value="DF">DF</option>
                            <option value="ES">ES</option>
                            <option value="GO">GO</option>
                            <option value="MA">MA</option>
                            <option value="MT">MT</option>
                            <option value="MS">MS</option>
                            <option value="MG">MG</option>
                            <option value="PA">PA</option>
                            <option value="PB">PB</option>
                            <option value="PR">PR</option>
                            <option value="PE">PE</option>
                            <option value="PI">PI</option>
                            <option value="RJ">RJ</option>
                            <option value="RN">RN</option>
                            <option value="RS">RS</option>
                            <option value="RO">RO</option>
                            <option value="RR">RR</option>
                            <option value="SC">SC</option>
                            <option value="SP">SP</option>
                            <option value="SE">SE</option>
                            <option value="TO">TO</option>
                        </select>
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                </div>
            </div>

            {/* References Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Referências Pessoais</h2>
                        <p className="text-sm text-gray-500">Mínimo de 2 referências obrigatórias para aprovação</p>
                    </div>
                    <button
                        type="button"
                        onClick={addReference}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} /> Adicionar
                    </button>
                </div>

                <div className="space-y-4">
                    {formData.references.map((ref, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-4 items-start bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1 w-full">
                                <label className="label text-xs">Nome da Referência</label>
                                <input
                                    type="text"
                                    value={ref.name}
                                    onChange={(e) => handleReferencesChange(index, 'name', e.target.value)}
                                    className="input text-sm"
                                    placeholder="Nome completo"
                                    required
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="label text-xs">Telefone</label>
                                <input
                                    type="text"
                                    value={ref.phone}
                                    onChange={(e) => handleReferencesChange(index, 'phone', formatPhone(e.target.value))}
                                    className="input text-sm"
                                    placeholder="(00) 00000-0000"
                                    required
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="label text-xs">Vínculo (Opcional)</label>
                                <input
                                    type="text"
                                    value={ref.relation}
                                    onChange={(e) => handleReferencesChange(index, 'relation', e.target.value)}
                                    className="input text-sm"
                                    placeholder="Ex: Amigo, Vizinho"
                                />
                            </div>
                            {formData.references.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeReference(index)}
                                    className="sm:mt-6 text-red-500 hover:text-red-700 p-2"
                                    title="Remover referência"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    {errors.references && <p className="text-red-500 text-sm mt-1">{errors.references}</p>}
                </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Documentos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-900">Clique para enviar ou arraste</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    </div>

                    <div className="space-y-3">
                        {files.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                Nenhum arquivo selecionado
                            </div>
                        ) : (
                            files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <CheckCircle size={16} className="text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/80 p-4 backdrop-blur rounded-lg border border-gray-200 shadow-lg">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-secondary"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary min-w-[150px]"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        isEditing ? 'Atualizar Pessoa' : 'Cadastrar Pessoa'
                    )}
                </button>
            </div>
        </form>
    )
}
