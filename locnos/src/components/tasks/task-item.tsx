'use client'

import { useState } from 'react'
import { TaskWithDetails } from './types'
import { Check, Calendar, User as UserIcon, AlignLeft } from 'lucide-react'
import { updateTask } from '@/app/dashboard/actions/tasks'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskItemProps {
    task: TaskWithDetails
    onSelect: (task: TaskWithDetails) => void
}

export function TaskItem({ task, onSelect }: TaskItemProps) {
    const [completed, setCompleted] = useState(task.status === 'COMPLETED')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isUpdating) return

        const newStatus = completed ? 'PENDING' : 'COMPLETED'
        setCompleted(!completed)
        setIsUpdating(true)

        try {
            await updateTask(task.id, { status: newStatus })
        } catch (error) {
            // Revert on error
            setCompleted(completed)
            console.error('Failed to update task', error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div
            className={`group flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors ${completed ? 'opacity-60' : ''}`}
            onClick={() => onSelect(task)}
        >
            <div
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400 group-hover:border-blue-600'
                    }`}
                onClick={handleToggle}
            >
                {completed && <Check className="w-3.5 h-3.5 text-white" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate transition-all ${completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {task.title}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 ${task.dueDate && new Date(task.dueDate) < new Date() && !completed ? 'text-red-500' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(task.dueDate), "dd MMM", { locale: ptBR })}</span>
                        </div>
                    )}

                    {task.subtasks.length > 0 && (
                        <div className="flex items-center gap-1">
                            <AlignLeft className="w-3 h-3" />
                            <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                        </div>
                    )}

                    {task.responsible && (
                        <div className="flex items-center gap-1" title={task.responsible.name || 'Responsável'}>
                            <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                {task.responsible.name?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
                            </div>
                        </div>
                    )}

                    {task.description && (
                        <span className="text-gray-400 line-clamp-1 max-w-[150px]">{task.description}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
