import { STATUS_PEDIDO } from '@/lib/utils';

interface StatusBadgeProps {
    status: keyof typeof STATUS_PEDIDO;
    className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const statusConfig = STATUS_PEDIDO[status];

    if (!statusConfig) {
        return <span className={`px-2 py-1 rounded text-sm ${className}`}>-</span>;
    }

    return (
        <span className={`px-2 py-1 rounded text-sm font-medium ${statusConfig.cor} ${className}`}>
            {statusConfig.label}
        </span>
    );
}
