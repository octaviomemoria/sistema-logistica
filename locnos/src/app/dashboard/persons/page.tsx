'use client'

import { useState, useEffect } from 'react'
import { getPersons, togglePersonStatus, setAsDefaulter, getPersonTypes, PersonFilter } from './actions'
import Link from 'next/link'
import { Plus, Search, Edit2, AlertTriangle, UserCheck, UserX, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PersonType {
    id: string
    name: string
    color: string
    system: boolean
}

interface Person {
    id: string
    name: string
    tradeName?: string
    document: string
    email?: string
    phone: string
    city: string
    state: string
    status: string
    active: boolean
    type: string
    personTypes: {
        personType: PersonType
    }[]
}

export default function PersonsPage() {
    const [persons, setPersons] = useState<Person[]>([])
    const [personTypes, setPersonTypes] = useState<PersonType[]>([])
    const [filter, setFilter] = useState<PersonFilter>('ALL')
    const [typeFilter, setTypeFilter] = useState<string[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const { showToast } = useToast()

    const loadPersonTypes = async () => {
        const result = await getPersonTypes()
        if (result.success) {
            setPersonTypes(result.personTypes as PersonType[])
        }
    }

    const loadPersons = async () => {
        setLoading(true)
        const result = await getPersons(filter, search, typeFilter.length > 0 ? typeFilter : undefined)
        if (result.success) {
            setPersons(result.persons as unknown as Person[])
        } else {
            showToast('error', 'Erro ao carregar pessoas')
        }
        setLoading(false)
    }

    useEffect(() => {
        loadPersonTypes()
    }, [])

    useEffect(() => {
        const debounce = setTimeout(loadPersons, 300)
        return () => clearTimeout(debounce)
    }, [filter, search, typeFilter])

    const handleToggleStatus = async (id: string, currentActive: boolean) => {
        const result = await togglePersonStatus(id, !currentActive)
        if (result.success) {
            showToast('success', `Pessoa ${!currentActive ? 'ativada' : 'inativada'} com sucesso`)
            loadPersons()
        } else {
            showToast('error', 'Erro ao alterar status')
        }
    }

    const handleToggleDefaulter = async (id: string, currentStatus: string) => {
        const isDefaulter = currentStatus === 'DEFAULTER'
        const result = await setAsDefaulter(id, !isDefaulter)
        if (result.success) {
            showToast('success', `Status de inadimplência atualizado`)
            loadPersons()
        } else {
            showToast('error', 'Erro ao atualizar status')
        }
    }

    const toggleTypeFilter = (typeId: string) => {
        setTypeFilter(prev =>
            prev.includes(typeId)
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId]
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Pessoas</h1>
                    <p className="text-gray-600">Gerencie sua base de pessoas e histórico</p>
                </div>
                <Link
                    href="/dashboard/persons/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                    <Plus size={18} strokeWidth={2} />
                    Nova Pessoa
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
                <div className="space-y-4">
                    {/* Status Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('ACTIVE')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setFilter('INACTIVE')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'INACTIVE' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Inativos
                        </button>
                        <button
                            onClick={() => setFilter('DEFAULTER')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === 'DEFAULTER' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                        >
                            Inadimplentes
                        </button>
                    </div>

                    {/* Type Filters */}
                    {personTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center">Tipos:</span>
                            {personTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => toggleTypeFilter(type.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter.includes(type.id)
                                        ? 'text-white shadow-sm'
                                        : 'bg-opacity-10 border border-opacity-30'
                                        }`}
                                    style={{
                                        backgroundColor: typeFilter.includes(type.id) ? type.color : `${type.color}20`,
                                        borderColor: type.color,
                                        color: typeFilter.includes(type.id) ? 'white' : type.color
                                    }}
                                >
                                    {type.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, documento..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Pessoa</th>
                                <th className="px-6 py-4 font-semibold">Tipos</th>
                                <th className="px-6 py-4 font-semibold">Contato</th>
                                <th className="px-6 py-4 font-semibold">Localização</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Carregando pessoas...
                                    </td>
                                </tr>
                            ) : persons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma pessoa encontrada com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                persons.map((person) => (
                                    <tr
                                        key={person.id}
                                        className={`hover:bg-gray-50 transition-colors ${!person.active ? 'opacity-60 bg-gray-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                                    ${person.status === 'DEFAULTER'
                                                        ? 'bg-red-100 text-red-700'
                                                        : person.type === 'PJ'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-indigo-100 text-indigo-700'
                                                    }`}
                                                >
                                                    {person.type}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                        {person.name}
                                                        {person.status === 'DEFAULTER' && (
                                                            <AlertCircle size={16} className="text-red-600" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{person.document}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {person.personTypes.length === 0 ? (
                                                    <span className="text-xs text-gray-400">Sem tipo</span>
                                                ) : (
                                                    person.personTypes.map(({ personType }) => (
                                                        <span
                                                            key={personType.id}
                                                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                                            style={{ backgroundColor: personType.color }}
                                                        >
                                                            {personType.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{person.phone}</div>
                                            <div className="text-gray-500 text-xs">{person.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900">{person.city}</span>
                                            <span className="text-gray-500 text-xs ml-1">/ {person.state}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${!person.active
                                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                                    : person.status === 'DEFAULTER'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}
                                            >
                                                {!person.active ? 'Inativo' : person.status === 'DEFAULTER' ? 'Inadimplente' : 'Ativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleDefaulter(person.id, person.status)}
                                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${person.status === 'DEFAULTER' ? 'text-red-600' : 'text-gray-400'}`}
                                                    title={person.status === 'DEFAULTER' ? "Remover inadimplência" : "Marcar como inadimplente"}
                                                >
                                                    <AlertTriangle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(person.id, person.active)}
                                                    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${person.active ? 'text-green-600' : 'text-gray-400'}`}
                                                    title={person.active ? "Inativar pessoa" : "Ativar pessoa"}
                                                >
                                                    {person.active ? <UserCheck size={18} /> : <UserX size={18} />}
                                                </button>
                                                <Link
                                                    href={`/dashboard/persons/${person.id}/edit`}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar pessoa"
                                                >
                                                    <Edit2 size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
