export const STATUS_PEDIDO = {
    faturado: { label: 'Faturado', cor: 'bg-blue-100 text-blue-800' },
    aguardando_separacao: { label: 'Aguardando Separação', cor: 'bg-yellow-100 text-yellow-800' },
    em_separacao: { label: 'Em Separação', cor: 'bg-orange-100 text-orange-800' },
    separado: { label: 'Separado', cor: 'bg-purple-100 text-purple-800' },
    em_conferencia: { label: 'Em Conferência', cor: 'bg-indigo-100 text-indigo-800' },
    conferido: { label: 'Conferido', cor: 'bg-cyan-100 text-cyan-800' },
    aguardando_expedicao: { label: 'Aguardando Expedição', cor: 'bg-teal-100 text-teal-800' },
    expedido: { label: 'Expedido', cor: 'bg-green-100 text-green-800' },
    em_transito: { label: 'Em Trânsito', cor: 'bg-lime-100 text-lime-800' },
    entregue: { label: 'Entregue', cor: 'bg-emerald-100 text-emerald-800' },
    cancelado: { label: 'Cancelado', cor: 'bg-red-100 text-red-800' },
};

export const PERFIS_USUARIO = {
    admin: 'Administrador',
    gestor: 'Gestor',
    separador: 'Separador',
    conferente: 'Conferente',
    motorista: 'Motorista',
};

export function formatarData(data: string | Date): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: string | Date): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
}

export function formatarMoeda(valor: number): string {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
}

export function formatarNumero(valor: number, decimais: number = 0): string {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimais,
        maximumFractionDigits: decimais,
    }).format(valor);
}

export function calcularDiasAtraso(dataPrevista: string | Date): number {
    if (!dataPrevista) return 0;
    const hoje = new Date();
    const prevista = new Date(dataPrevista);
    const diff = hoje.getTime() - prevista.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
