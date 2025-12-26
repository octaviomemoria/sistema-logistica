'use client'

import { useState, useEffect } from 'react'
import { getTasks } from '@/app/dashboard/actions/tasks'
import { getUsers } from '@/app/dashboard/actions/users'
import { TaskList } from '@/components/tasks/task-list'
import type { TaskFilterValues } from '@/components/tasks/TaskFilters'

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState<TaskFilterValues>({})

    useEffect(() => {
        loadData()
    }, [filters])

    const loadData = async () => {
        setIsLoading(true)

        const [tasksResult, usersResult] = await Promise.all([
            getTasks({
                search: filters.search,
                status: filters.status,
                priority: filters.priority,
                responsibleId: filters.responsibleId,
                dueDateFrom: filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined,
                dueDateTo: filters.dueDateTo ? new Date(filters.dueDateTo) : undefined,
            }),
            getUsers()
        ])

        if (tasksResult.success && tasksResult.data) {
            setTasks(tasksResult.data)
        }
        if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data)
        }

        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-2rem)]">
            <TaskList initialTasks={tasks} users={users} onFilterChange={setFilters} />
        </div>
    )
}
