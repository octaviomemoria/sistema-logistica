'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '../actions'
import { UserStatus } from '@prisma/client'

interface UserFormProps {
    roles: Array<{ id: string; name: string }>
}

export default function UserForm({ roles }: UserFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [tempPassword, setTempPassword] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setTempPassword('')

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string || undefined,
            roleId: formData.get('roleId') as string,
            status: formData.get('status') as UserStatus
        }

        try {
            const result = await createUser(data)
            setTempPassword(result.tempPassword)

            // Aguardar um momento para o usuário ver a senha
            setTimeout(() => {
                router.push('/dashboard/settings/users')
                router.refresh()
            }, 5000)
        } catch (err: any) {
            setError(err.message || 'Erro ao criar usuário')
            setLoading(false)
        }
    }

    if (tempPassword) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-green-800 mb-4">
                        ✅ Usuário criado com sucesso!
                    </h2>

                    <div className="bg-white border border-green-300 rounded p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Senha temporária gerada:</p>
                        <p className="text-2xl font-mono font-bold text-gray-900 select-all">
                            {tempPassword}
                        </p>
                    </div>

                    <p className="text-sm text-gray-700">
                        ⚠️ <strong>Importante:</strong> Copie esta senha agora! Ela não será exibida novamente.
                        O usuário deverá utilizá-la no primeiro acesso.
                    </p>

                    <p className="text-xs text-gray-500 mt-4">
                        Redirecionando para a lista de usuários em 5 segundos...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Novo Usuário</h1>
                <p className="text-gray-600">Preencha os dados para criar um novo usuário</p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: João da Silva"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: joao@empresa.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: (11) 98765-4321"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Perfil de Acesso *
                    </label>
                    <select
                        name="roleId"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione um perfil</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Inicial
                    </label>
                    <select
                        name="status"
                        defaultValue="PENDING"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="PENDING">Pendente (aguardando primeiro acesso)</option>
                        <option value="ACTIVE">Ativo (pode fazer login imediatamente)</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium"
                    >
                        {loading ? 'Criando...' : 'Criar Usuário'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                </div>

                <p className="text-xs text-gray-500">
                    * Uma senha temporária será gerada automaticamente e exibida após a criação.
                </p>
            </form>
        </div>
    )
}
