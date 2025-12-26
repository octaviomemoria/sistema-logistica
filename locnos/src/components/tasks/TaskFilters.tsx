'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'

// Inline debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

interface SimpleUser {
    id: string
    name: string | null
    email: string
}

interface TaskFiltersProps {
    users: SimpleUser[]
    onFilterChange: (filters: TaskFilterValues) => void
    activeFilterCount: number
}

export interface TaskFilterValues {
    search?: string
    status?: string
    priority?: string
    responsibleId?: string
    dueDateFrom?: string
    dueDateTo?: string
}

export function TaskFilters({ users, onFilterChange, activeFilterCount }: TaskFiltersProps) {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [priority, setPriority] = useState('')
    const [responsibleId, setResponsibleId] = useState('')
    const [dueDateFrom, setDueDateFrom] = useState('')
    const [dueDateTo, setDueDateTo] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Debounce search to avoid too many queries
    const debouncedSearch = useDebounce(search, 300)

    // Emit filter changes
    const emitFilters = useCallback((overrides: Partial<TaskFilterValues> = {}) => {
        const filters: TaskFilterValues = {
            search: overrides.search !== undefined ? overrides.search : debouncedSearch,
            status: overrides.status !== undefined ? overrides.status : status,
            priority: overrides.priority !== undefined ? overrides.priority : priority,
            responsibleId: overrides.responsibleId !== undefined ? overrides.responsibleId : responsibleId,
            dueDateFrom: overrides.dueDateFrom !== undefined ? overrides.dueDateFrom : dueDateFrom,
            dueDateTo: overrides.dueDateTo !== undefined ? overrides.dueDateTo : dueDateTo,
        }

        // Remove empty values
        Object.keys(filters).forEach(key => {
            if (!filters[key as keyof TaskFilterValues]) {
                delete filters[key as keyof TaskFilterValues]
            }
        })

        onFilterChange(filters)
    }, [debouncedSearch, status, priority, responsibleId, dueDateFrom, dueDateTo, onFilterChange])

    // Emit when debounced search changes
    useCallback(() => {
        emitFilters()
    }, [debouncedSearch, emitFilters])

    const handleClearFilters = () => {
        setSearch('')
        setStatus('')
        setPriority('')
        setResponsibleId('')
        setDueDateFrom('')
        setDueDateTo('')
        onFilterChange({})
    }

    return (
        <div className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
            <div className="p-4 px-6 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setTimeout(() => emitFilters({ search: e.target.value }), 300)
                        }}
                        placeholder="Buscar tarefas..."
                        className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                        {activeFilterCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {activeFilterCount > 0 && (
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value)
                                    emitFilters({ status: e.target.value })
                                }}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                <option value="PENDING">Pendente</option>
                                <option value="COMPLETED">Concluída</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Prioridade
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => {
                                    setPriority(e.target.value)
                                    emitFilters({ priority: e.target.value })
                                }}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todas</option>
                                <option value="LOW">Baixa</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">Alta</option>
                            </select>
                        </div>

                        {/* Responsible Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Responsável
                            </label>
                            <select
                                value={responsibleId}
                                onChange={(e) => {
                                    setResponsibleId(e.target.value)
                                    emitFilters({ responsibleId: e.target.value })
                                }}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todos</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Vencimento
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dueDateFrom}
                                    onChange={(e) => {
                                        setDueDateFrom(e.target.value)
                                        emitFilters({ dueDateFrom: e.target.value })
                                    }}
                                    className="w-full px-2 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    type="date"
                                    value={dueDateTo}
                                    onChange={(e) => {
                                        setDueDateTo(e.target.value)
                                        emitFilters({ dueDateTo: e.target.value })
                                    }}
                                    className="w-full px-2 py-2 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
