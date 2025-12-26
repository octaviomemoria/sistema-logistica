'use client'

import { useState } from 'react'
import { TaskWithDetails } from './types'
import { TaskItem } from './task-item'
import { TaskDetails } from './task-details'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskFilters, TaskFilterValues } from './TaskFilters'

// Define a minimal User type locally or import if available in types
interface SimpleUser {
    id: string
    name: string | null
    email: string
}

interface TaskListProps {
    initialTasks: TaskWithDetails[]
    users: SimpleUser[]
    onFilterChange: (filters: TaskFilterValues) => void
}

export function TaskList({ initialTasks, users, onFilterChange }: TaskListProps) {

    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
    const [showCompleted, setShowCompleted] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // In a real app with real-time needs, we might use optimistic updates here too, 
    // but for now we rely on the Server Action's revalidatePath updates passed down via props,
    // OR we just use the props as source of truth.
    // Since page.tsx passes fresh data on revalidate, using props is fine for the list.
    // However, for immediate feedback, we might want local state.
    // For MVP, letting revalidatePath handle list updates is simplest, though slightly slower.
    // "My Tasks" visual style.

    const pendingTasks = initialTasks.filter(t => t.status !== 'COMPLETED')
    const completedTasks = initialTasks.filter(t => t.status === 'COMPLETED')

    const handleDeleteTask = () => {
        setSelectedTask(null)
    }

    // Count active filters
    const activeFilterCount = Object.keys(onFilterChange).length

    return (
        <div className="flex bg-white dark:bg-zinc-950 min-h-[calc(100vh-4rem)] rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 relative overflow-hidden">
            {/* Main List Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedTask ? 'mr-96' : ''}`}>

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tarefas</h1>
                        <p className="text-sm text-gray-500">Gerencie suas atividades diárias</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nova Tarefa</span>
                    </button>
                </div>

                {/* Filters */}
                <TaskFilters
                    users={users}
                    onFilterChange={onFilterChange}
                    activeFilterCount={activeFilterCount}
                />

                {/* Task List */}
                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-1">
                    {pendingTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onSelect={setSelectedTask}
                        />
                    ))}

                    {completedTasks.length > 0 && (
                        <div className="mt-8">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg w-full"
                            >
                                {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                <span>Concluídas ({completedTasks.length})</span>
                            </button>

                            {showCompleted && (
                                <div className="mt-2 space-y-1 ml-2 border-l-2 border-gray-100 dark:border-zinc-800 pl-2">
                                    {completedTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onSelect={setSelectedTask}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {initialTasks.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nenhuma tarefa ainda</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Adicione uma tarefa acima para começar a organizar seu dia.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Slide-Over */}
            {selectedTask && (
                <TaskDetails
                    task={selectedTask}
                    users={users}
                    isOpen={true}
                    onClose={() => setSelectedTask(null)}
                    onDelete={handleDeleteTask}
                />
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                users={users}
            />
        </div>
    )
}
