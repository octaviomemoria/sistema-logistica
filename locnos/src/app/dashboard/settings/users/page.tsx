import { Suspense } from 'react'
import Link from 'next/link'
import { getUsers } from './actions'
import { getRoles } from '../roles/actions'
import { UserStatus } from '@prisma/client'

export default async function UsersPage({
    searchParams
}: {
    searchParams: { status?: UserStatus; roleId?: string; search?: string }
}) {
    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Usuários</h1>
                    <p className="text-gray-600">Gerencie usuários e permissões do sistema</p>
                </div>
                <Link
                    href="/dashboard/settings/users/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                    + Novo Usuário
                </Link>
            </div>

            <Suspense fallback={<div>Carregando...</div>}>
                <UsersTable searchParams={searchParams} />
            </Suspense>
        </div>
    )
}

async function UsersTable({
    searchParams
}: {
    searchParams: { status?: UserStatus; roleId?: string; search?: string }
}) {
    const [users, roles] = await Promise.all([
        getUsers(searchParams),
        getRoles()
    ])

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Filtros */}
            <div className="p-4 border-b flex gap-4">
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    defaultValue={searchParams.search}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    name="search"
                />

                <select
                    defaultValue={searchParams.status}
                    className="px-3 py-2 border rounded-lg"
                    name="status"
                >
                    <option value="">Todos os status</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="PENDING">Pendente</option>
                </select>

                <select
                    defaultValue={searchParams.roleId}
                    className="px-3 py-2 border rounded-lg"
                    name="roleId"
                >
                    <option value="">Todos os perfis</option>
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>
                            {role.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Nome
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Perfil
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Último Acesso
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum usuário encontrado
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{user.role?.name || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
                                            : 'Nunca'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/dashboard/settings/users/${user.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Editar
                                            </Link>
                                            {user.status === 'BLOCKED' && (
                                                <button className="text-green-600 hover:text-green-800 text-sm">
                                                    Desbloquear
                                                </button>
                                            )}
                                            {user.status !== 'BLOCKED' && (
                                                <button className="text-orange-600 hover:text-orange-800 text-sm">
                                                    Reset Senha
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: UserStatus }) {
    const styles = {
        ACTIVE: 'bg-green-100 text-green-800',
        INACTIVE: 'bg-gray-100 text-gray-800',
        BLOCKED: 'bg-red-100 text-red-800',
        PENDING: 'bg-yellow-100 text-yellow-800'
    }

    const labels = {
        ACTIVE: 'Ativo',
        INACTIVE: 'Inativo',
        BLOCKED: 'Bloqueado',
        PENDING: 'Pendente'
    }

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
            {labels[status]}
        </span>
    )
}
