'use client'

import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
}

const toastStyles = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToast()

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => {
                const Icon = toastIcons[toast.type]
                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg min-w-[300px] max-w-[500px] animate-slide-in ${toastStyles[toast.type]}`}
                    >
                        <Icon size={20} className="flex-shrink-0" />
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 hover:opacity-70 transition-opacity"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
