import { ReactNode } from 'react';

interface CardProps {
    titulo?: string;
    children: ReactNode;
    className?: string;
    acoes?: ReactNode;
}

export default function Card({ titulo, children, className = '', acoes }: CardProps) {
    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
            {(titulo || acoes) && (
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    {titulo && <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>}
                    {acoes && <div>{acoes}</div>}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}

interface CardKPIProps {
    titulo: string;
    valor: string | number;
    icone?: ReactNode;
    cor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    descricao?: string;
    tendencia?: {
        valor: number;
        positivo: boolean;
    };
}

export function CardKPI({ titulo, valor, icone, cor = 'blue', descricao, tendencia }: CardKPIProps) {
    const coresBase = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">{titulo}</p>
                {icone && (
                    <div className={`p-2 rounded-lg ${coresBase[cor]}`}>
                        {icone}
                    </div>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{valor}</p>
                {tendencia && (
                    <span className={`text-sm font-medium ${tendencia.positivo ? 'text-green-600' : 'text-red-600'}`}>
                        {tendencia.positivo ? '↑' : '↓'} {Math.abs(tendencia.valor)}%
                    </span>
                )}
            </div>
            {descricao && (
                <p className="mt-2 text-sm text-gray-500">{descricao}</p>
            )}
        </div>
    );
}
