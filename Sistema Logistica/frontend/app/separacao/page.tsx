'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatarData, formatarMoeda, calcularDiasAtraso } from '@/lib/utils';
import { Search, Package, AlertCircle, Clock, User, FileText } from 'lucide-react';

interface Pedido {
    id: string;
    numero_pedido: string;
    numero_nf: string;
    data_faturamento: string;
    valor_total: number;
    quantidade_itens: number;
    clientes: {
        nome: string;
        cidade: string;
    };
    itens_pedido: any[];
}

export default function SeparacaoPage() {
    const router = useRouter();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [iniciandoSeparacao, setIniciandoSeparacao] = useState<string | null>(null);

    useEffect(() => {
        carregarPedidos();
    }, []);

    const carregarPedidos = async () => {
        setCarregando(true);
        try {
            const { data } = await api.get('/separacao/disponiveis');
            setPedidos(data.pedidos || []);
        } catch (erro) {
            console.error('Erro ao carregar pedidos:', erro);
            alert('Erro ao carregar pedidos disponíveis');
        } finally {
            setCarregando(false);
        }
    };

    const iniciarSeparacao = async (pedidoId: string) => {
        setIniciandoSeparacao(pedidoId);
        try {
            const { data } = await api.post('/separacao/iniciar', {
                pedido_id: pedidoId
            });

            // Redirecionar para página de separação ativa
            router.push(`/separacao/${data.separacao.id}`);
        } catch (erro: any) {
            console.error('Erro ao iniciar separação:', erro);
            const mensagem = erro.response?.data?.erro || 'Erro ao iniciar separação';
            alert(mensagem);
        } finally {
            setIniciandoSeparacao(null);
        }
    };

    const pedidosFiltrados = pedidos.filter((pedido) => {
        if (!busca) return true;
        const buscaLower = busca.toLowerCase();
        return (
            pedido.numero_pedido?.toLowerCase().includes(buscaLower) ||
            pedido.numero_nf?.toLowerCase().includes(buscaLower) ||
            pedido.clientes?.nome?.toLowerCase().includes(buscaLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Separação de Pedidos</h1>
                    <p className="text-gray-500 mt-1">Pedidos disponíveis para separação</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Package className="text-primary" size={20} />
                    <span className="font-semibold text-gray-900">{pedidosFiltrados.length}</span>
                    <span className="text-gray-600">pedidos disponíveis</span>
                </div>
            </div>

            {/* Busca */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por número de pedido, NF ou cliente..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Lista de Pedidos */}
            {carregando ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">Carregando pedidos...</p>
                </div>
            ) : pedidosFiltrados.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Package className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {busca ? 'Nenhum pedido encontrado' : 'Nenhum pedido disponível'}
                    </h3>
                    <p className="text-gray-500">
                        {busca
                            ? 'Tente ajustar os filtros de busca'
                            : 'Não há pedidos aguardando separação no momento'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pedidosFiltrados.map((pedido) => {
                        const diasAtraso = calcularDiasAtraso(pedido.data_faturamento);
                        const pendente = diasAtraso > 3;
                        const qtdItens = pedido.itens_pedido?.length || 0;

                        return (
                            <div
                                key={pedido.id}
                                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${pendente ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                    }`}
                            >
                                <div className="p-6">
                                    {/* Alerta de Prioridade */}
                                    {pendente && (
                                        <div className="flex items-center gap-2 mb-4 text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                                            <AlertCircle size={16} />
                                            <span className="text-sm font-medium">
                                                Pedido há {diasAtraso} dias
                                            </span>
                                        </div>
                                    )}

                                    {/* Número do Pedido */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Pedido</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {pedido.numero_pedido}
                                            </p>
                                        </div>
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Package className="text-primary" size={24} />
                                        </div>
                                    </div>

                                    {/* Informações do Cliente */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <User className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {pedido.clientes?.nome || 'Cliente não informado'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {pedido.clientes?.cidade || ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <FileText className="text-gray-400 flex-shrink-0" size={16} />
                                            <p className="text-sm text-gray-600">
                                                NF: <span className="font-medium">{pedido.numero_nf || '-'}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Clock className="text-gray-400 flex-shrink-0" size={16} />
                                            <p className="text-sm text-gray-600">
                                                Faturado em {formatarData(pedido.data_faturamento)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Estatísticas */}
                                    <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Itens</p>
                                            <p className="text-lg font-bold text-gray-900">{qtdItens}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {formatarMoeda(pedido.valor_total)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Botão de Ação */}
                                    <button
                                        onClick={() => iniciarSeparacao(pedido.id)}
                                        disabled={iniciandoSeparacao === pedido.id}
                                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${pendente
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-primary hover:bg-blue-700 text-white'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {iniciandoSeparacao === pedido.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Iniciando...
                                            </span>
                                        ) : (
                                            'Iniciar Separação'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
