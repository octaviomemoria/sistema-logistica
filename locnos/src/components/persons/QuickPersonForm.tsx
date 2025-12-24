'use client'

import { useState } from 'react'
import { createPerson } from '@/app/dashboard/persons/actions'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatCNPJ, formatPhone, formatCEP, validateCPF, validateCNPJ } from '@/lib/utils'
import { Loader2, Save, Search } from 'lucide-react'

interface QuickPersonFormProps {
    onSuccess: (person: any) => void
    onCancel: () => void
}

export default function QuickPersonForm({ onSuccess, onCancel }: QuickPersonFormProps) {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [searchingCep, setSearchingCep] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        type: 'PF',
        name: '',
        document: '',
        phone: '',
        zipCode: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        email: '' // Added email as optional but good to have
    })

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
            // For quick add, we don't handle files/references/types strictly. 
            // We use default Active status and maybe a default Type if we had one.
            // Backend handles defaults.
            const submitData = {
                ...formData,
                status: 'ACTIVE',
                active: true,
                // references: [],
                // personTypeIds: [] 
            }

            const result = await createPerson(submitData)

            if (result.success) {
                showToast('success', 'Cliente cadastrado com sucesso!')
                onSuccess(result.person)
            } else {
                showToast('error', result.error || 'Erro ao cadastrar')
            }
        } catch (error) {
            showToast('error', 'Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'PF', document: '' }))}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${formData.type === 'PF' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pessoa Física
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'PJ', document: '' }))}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${formData.type === 'PJ' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pessoa Jurídica
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="label text-xs">Nome / Razão Social *</label>
                    <input
                        className={`input ${errors.name ? 'border-red-500' : ''}`}
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={formData.type === 'PF' ? 'Nome Completo' : 'Empresa LTDA'}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="label text-xs">{formData.type === 'PF' ? 'CPF' : 'CNPJ'} *</label>
                    <input
                        className={`input ${errors.document ? 'border-red-500' : ''}`}
                        value={formData.document}
                        onChange={e => setFormData(prev => ({ ...prev, document: formData.type === 'PF' ? formatCPF(e.target.value) : formatCNPJ(e.target.value) }))}
                        placeholder={formData.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    />
                    {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document}</p>}
                </div>

                <div>
                    <label className="label text-xs">Telefone *</label>
                    <input
                        className={`input ${errors.phone ? 'border-red-500' : ''}`}
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                        placeholder="(00) 00000-0000"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                    <label className="label text-xs">Email (Opcional)</label>
                    <input
                        type="email"
                        className="input"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label text-xs">CEP *</label>
                    <div className="relative">
                        <input
                            className={`input ${errors.zipCode ? 'border-red-500' : ''}`}
                            value={formData.zipCode}
                            onChange={e => setFormData(prev => ({ ...prev, zipCode: formatCEP(e.target.value) }))}
                            onBlur={searchCep}
                        />
                        <button type="button" onClick={searchCep} className="absolute right-2 top-2 text-gray-400 hover:text-blue-600">
                            {searchingCep ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="label text-xs">Rua *</label>
                    <input
                        className={`input ${errors.street ? 'border-red-500' : ''}`}
                        value={formData.street}
                        onChange={e => setFormData(prev => ({ ...prev, street: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label text-xs">Número *</label>
                    <input
                        className={`input ${errors.number ? 'border-red-500' : ''}`}
                        value={formData.number}
                        onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label text-xs">Bairro</label>
                    <input
                        className="input"
                        value={formData.neighborhood}
                        onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label text-xs">Cidade *</label>
                    <input
                        className={`input ${errors.city ? 'border-red-500' : ''}`}
                        value={formData.city}
                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="label text-xs">UF *</label>
                    <input
                        className={`input ${errors.state ? 'border-red-500' : ''}`}
                        value={formData.state}
                        onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        maxLength={2}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Cadastrar
                </button>
            </div>
        </form>
    )
}
