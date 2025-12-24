import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: number | string
    icon: LucideIcon
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    subtitle?: string
}

export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }: StatsCardProps) {
    const colorStyles = {
        blue: {
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            border: 'border-blue-100'
        },
        green: {
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            border: 'border-green-100'
        },
        yellow: {
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            border: 'border-amber-100'
        },
        red: {
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            border: 'border-red-100'
        },
        purple: {
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            border: 'border-purple-100'
        }
    }

    const styles = colorStyles[color]

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
                <div className={`p-2.5 rounded-lg ${styles.iconBg} ${styles.border} border`}>
                    <Icon size={20} className={styles.iconColor} strokeWidth={2} />
                </div>
            </div>
            <div className="mb-2">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
            )}
        </div>
    )
}
