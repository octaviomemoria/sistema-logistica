'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUser, toggleUserStatus, blockUser, unblockUser, resetPassword, deleteUser } from '../actions'
import { UserStatus } from '@prisma/client'

interface EditUserFormProps {
    user: {
        id: string
        name: string
        email: string
        phone?: string | null
        status: UserStatus
        isActive: boolean
        roleId: string | null
        role?: { id: string; name: string } | null
    }
    roles: Array<{ id: string; name: string }>
}

export default function EditUserForm({ user, roles }: EditUserFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string || undefined,
            roleId: formData.get('roleId') as string,
            status: formData.get('status') as UserStatus
        }

        try {
            await updateUser(user.id, data)
            setSuccess('Usuário atualizado com sucesso!')
            setTimeout(() => router.refresh(), 1000)
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar usuário')
        } finally {
            setLoading(false)
        }
    }

    async function handleToggleStatus() {
        if (!confirm(`Deseja ${user.isActive ? 'desativar' : 'ativar'} este usuário?`)) return

        try {
            await toggleUserStatus(user.id, !user.isActive)
            setSuccess(`Usuário ${user.isActive ? 'desativado' : 'ativado'} com sucesso!`)
            setTimeout(() => router.refresh(), 1000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    async function handleBlock() {
        const reason = prompt('Motivo do bloqueio:')
        if (!reason) return

        try {
            await blockUser(user.id, reason)
            setSuccess('Usuário bloqueado com sucesso!')
            setTimeout(() => router.refresh(), 1000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    async function handleUnblock() {
        if (!confirm('Deseja desbloquear este usuário?')) return

        try {
            await unblockUser(user.id)
            setSuccess('Usuário desbloqueado com sucesso!')
            setTimeout(() => router.refresh(), 1000)
        } catch (err: any) {
            setError(err.message)
        }
    }

    async function handleResetPassword() {
        if (!confirm('Deseja gerar uma nova senha temporária para este usuário?')) return

        try {
            const result = await resetPassword(user.id)
            setNewPassword(result.tempPassword)
            setShowResetPassword(true)
            setSuccess('Senha resetada com sucesso!')
        } catch (err: any) {
            setError(err.message)
        }
    }

    async function handleDelete() {
        if (!confirm('Tem certeza que deseja inativar este usuário? Esta ação pode ser revertida.')) return

        try {
            await deleteUser(user.id)
            router.push('/dashboard/settings/users')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Editar Usuário</h1>
                <p className="text-gray-600">{user.email}</p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            {showResetPassword && newPassword && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Nova senha temporária:</p>
                    <p className="text-xl font-mono font-bold text-yellow-900 select-all">{newPassword}</p>
                    <p className="text-xs text-yellow-700 mt-2">
                        ⚠️ Copie esta senha agora! Ela não será exibida novamente.
                    </p>
                    <button
                        onClick={() => setShowResetPassword(false)}
                        className="mt-2 text-xs text-yellow-700 underline"
                    >
                        Fechar
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Formulário principal */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                name="name"
                                defaultValue={user.name}
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email (não editável)
                            </label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                defaultValue={user.phone || ''}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Perfil de Acesso *
                            </label>
                            <select
                                name="roleId"
                                defaultValue={user.roleId || ''}
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
                                Status
                            </label>
                            <select
                                name="status"
                                defaultValue={user.status}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                                <option value="BLOCKED">Bloqueado</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium"
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Ações rápidas */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-medium mb-3">Ações Rápidas</h3>
                        <div className="space-y-2">
                            <button
                                onClick={handleToggleStatus}
                                className={`w-full px-4 py-2 rounded text-sm font-medium ${user.isActive
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {user.isActive ? '⏸ Desativar' : '▶ Ativar'} Usuário
                            </button>

                            <button
                                onClick={handleResetPassword}
                                className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-sm font-medium"
                            >
                                🔑 Resetar Senha
                            </button>

                            {user.status === 'BLOCKED' ? (
                                <button
                                    onClick={handleUnblock}
                                    className="w-full px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium"
                                >
                                    🔓 Desbloquear
                                </button>
                            ) : (
                                <button
                                    onClick={handleBlock}
                                    className="w-full px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium"
                                >
                                    🔒 Bloquear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-medium mb-3 text-red-700">Zona de Perigo</h3>
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded text-sm font-medium"
                        >
                            🗑 Deletar Usuário
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            O usuário será inativado, mas não será removido permanentemente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
