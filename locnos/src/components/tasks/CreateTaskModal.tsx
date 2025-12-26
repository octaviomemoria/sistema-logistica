'use client'

import { useState } from 'react'
import { X, Calendar, User, Repeat, Bell } from 'lucide-react'
import { createTask } from '@/app/dashboard/actions/tasks'

interface SimpleUser {
    id: string
    name: string | null
    email: string
}

interface CreateTaskModalProps {
    isOpen: boolean
    onClose: () => void
    users: SimpleUser[]
}

const RECURRENCE_OPTIONS = [
    { value: 'DAILY', label: 'Diário' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'BIWEEKLY', label: 'Quinzenal' },
    { value: 'MONTHLY', label: 'Mensal' },
    { value: 'MONTHLY_SAME_DAY', label: 'Mesmo dia do mês' },
    { value: 'CUSTOM', label: 'Personalizado' },
]

export function CreateTaskModal({ isOpen, onClose, users }: CreateTaskModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [responsibleId, setResponsibleId] = useState('')
    const [priority, setPriority] = useState('NORMAL')

    // Recurrence fields
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceType, setRecurrenceType] = useState<string>('')
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

    // Reminder fields
    const [reminderEnabled, setReminderEnabled] = useState(false)
    const [reminderDate, setReminderDate] = useState('')
    const [reminderTime, setReminderTime] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSubmitting(true)

        const taskData: any = {
            title,
            description: description || undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            responsibleId: responsibleId || undefined,
            priority,
            isRecurring,
        }

        if (isRecurring && recurrenceType) {
            taskData.recurrenceType = recurrenceType
            taskData.recurrenceInterval = recurrenceType === 'CUSTOM' ? recurrenceInterval : 1
            taskData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
        }

        if (reminderEnabled && reminderDate && reminderTime) {
            const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`)
            taskData.reminderEnabled = true
            taskData.reminderDateTime = reminderDateTime
        }

        await createTask(taskData)

        // Reset form
        setTitle('')
        setDescription('')
        setDueDate('')
        setResponsibleId('')
        setPriority('NORMAL')
        setIsRecurring(false)
        setRecurrenceType('')
        setRecurrenceInterval(1)
        setRecurrenceEndDate('')
        setReminderEnabled(false)
        setReminderDate('')
        setReminderTime('')
        setIsSubmitting(false)

        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nova Tarefa</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                            placeholder="Digite o título da tarefa"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 min-h-[100px] resize-none"
                            placeholder="Adicione detalhes..."
                        />
                    </div>

                    {/* Due Date & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Data de Conclusão
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Prioridade
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="LOW">Baixa</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">Alta</option>
                            </select>
                        </div>
                    </div>

                    {/* Responsible */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Responsável
                        </label>
                        <select
                            value={responsibleId}
                            onChange={(e) => setResponsibleId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="">Sem responsável</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* Recurrence Section */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="isRecurring"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                <Repeat className="w-4 h-4 inline mr-1" />
                                Tarefa Recorrente
                            </label>
                        </div>

                        {isRecurring && (
                            <div className="ml-6 space-y-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Frequência
                                    </label>
                                    <select
                                        value={recurrenceType}
                                        onChange={(e) => setRecurrenceType(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">Selecione a frequência</option>
                                        {RECURRENCE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {recurrenceType === 'CUSTOM' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Intervalo (dias)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Terminar em (opcional)
                                    </label>
                                    <input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reminder Section */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="reminderEnabled"
                                checked={reminderEnabled}
                                onChange={(e) => setReminderEnabled(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                <Bell className="w-4 h-4 inline mr-1" />
                                Lembrete
                            </label>
                        </div>

                        {reminderEnabled && (
                            <div className="ml-6 grid grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Data
                                    </label>
                                    <input
                                        type="date"
                                        value={reminderDate}
                                        onChange={(e) => setReminderDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Horário
                                    </label>
                                    <input
                                        type="time"
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Criando...' : 'Criar Tarefa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
