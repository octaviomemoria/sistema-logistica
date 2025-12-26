'use client'

import { useState, useEffect } from 'react'
import { TaskWithDetails } from './types'
import { X, Trash2, Plus, Calendar, User } from 'lucide-react'
import { updateTask, deleteTask, createSubtask, toggleSubtask, deleteSubtask } from '@/app/dashboard/actions/tasks'
import { format } from 'date-fns'

interface SimpleUser {
    id: string
    name: string | null
    email: string
}

interface TaskDetailsProps {
    task: TaskWithDetails
    users: SimpleUser[]
    isOpen: boolean
    onClose: () => void
    onDelete: () => void
}

export function TaskDetails({ task, users, isOpen, onClose, onDelete }: TaskDetailsProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [newSubtask, setNewSubtask] = useState('')
    const [dueDate, setDueDate] = useState<string>(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
    const [responsibleId, setResponsibleId] = useState(task.responsibleId || '')

    // Sync state when task changes
    useEffect(() => {
        setTitle(task.title)
        setDescription(task.description || '')
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')
        setResponsibleId(task.responsibleId || '')
    }, [task])

    if (!isOpen) return null

    const handleTitleBlur = async () => {
        if (title !== task.title) {
            await updateTask(task.id, { title })
        }
    }

    const handleDescriptionBlur = async () => {
        if (description !== task.description) {
            await updateTask(task.id, { description })
        }
    }

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value
        setDueDate(newDate)
        await updateTask(task.id, { dueDate: newDate ? new Date(newDate) : null })
    }

    const handleResponsibleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRespId = e.target.value
        setResponsibleId(newRespId)
        await updateTask(task.id, { responsibleId: newRespId || null })
    }

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSubtask.trim()) return
        await createSubtask(task.id, newSubtask)
        setNewSubtask('')
    }

    const handleDelete = async () => {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            await deleteTask(task.id)
            onDelete()
        }
    }

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-zinc-900 shadow-2xl border-l border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="text-sm font-medium text-gray-500">Detalhes da Tarefa</div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    placeholder="Título da tarefa"
                />

                {/* Meta Inputs */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Date */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Data de Conclusão</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dueDate}
                                onChange={handleDateChange}
                                className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {/* Responsible */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Responsável</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={responsibleId}
                                onChange={handleResponsibleChange}
                                className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-lg py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                            >
                                <option value="">Sem responsável</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Observações</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        className="w-full min-h-[100px] text-sm bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                        placeholder="Adicione detalhes..."
                    />
                </div>

                {/* Subtasks */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtarefas</label>

                    <div className="space-y-1">
                        {task.subtasks.map(st => (
                            <div key={st.id} className="group flex items-center gap-2 py-1">
                                <input
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={() => toggleSubtask(st.id, !st.completed)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {st.title}
                                </span>
                                <button
                                    onClick={() => deleteSubtask(st.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                        <Plus className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Adicionar subtarefa"
                            className="flex-1 text-sm bg-transparent border-none focus:ring-0 p-0 placeholder-gray-400"
                        />
                    </form>
                </div>

            </div>
        </div>
    )
}
