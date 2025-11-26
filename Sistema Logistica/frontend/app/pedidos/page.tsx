'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { formatarData, formatarMoeda } from '@/lib/utils';
import { Search, Filter, Eye, Download } from 'lucide-react';

export default function PedidosPage() {
    const router = useRouter();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    useEffect(() => {
        carregarPedidos();
    }, [paginaAtual, filtroStatus]);

    const carregarPedidos = async () => {
        setCarregando(true);
        try {
            const params: any = {
                pagina: paginaAtual,
                limite: 20,
            };

            if (filtroStatus) {
                params.status = filtroStatus;
            }

            const { data } = await api.get('/pedidos', { params });
            setPedidos(data.pedidos);
            setTotalPaginas(data.paginacao.totalPaginas);
        } catch (erro) {
            console.error('Erro ao carregar pedidos:', erro);
        } finally {
            setCarregando(false);
        }
    };

    const pedidosFiltrados = pedidos.filter((pedido) => {
        if (!busca) return true;
        const buscaLower = busca.toLowerCase();
        return (
            pedido.numero_pedido?.toLowerCase().includes(buscaLower) ||
            pedido.numero_nf?.toLowerCase().includes(buscaLower) ||
            pedido.cliente_nome?.toLowerCase().includes(buscaLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500 mt-1">Gestão completa de pedidos</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Busca */}
                    <div className="md:col-span-2">
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

                    {/* Filtro de Status */}
                    <div>
                        <select
                            value={filtroStatus}
                            onChange={(e) => {
                                setFiltroStatus(e.target.value);
                                setPaginaAtual(1);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Todos os Status</option>
                            <option value="faturado">Faturado</option>
                            <option value="aguardando_separacao">Aguardando Separação</option>
                            <option value="em_separacao">Em Separação</option>
                            <option value="separado">Separado</option>
                            <option value="conferido">Conferido</option>
                            <option value="expedido">Expedido</option>
                            <option value="em_transito">Em Trânsito</option>
                            <option value="entregue">Entregue</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabela de Pedidos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {carregando ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Carregando pedidos...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Pedido</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NF</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Região</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pedidosFiltrados.length > 0 ? (
                                        pedidosFiltrados.map((pedido) => (
                                            <tr
                                                key={pedido.id}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => router.push(`/pedidos/${pedido.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-gray-900">{pedido.numero_pedido}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{pedido.numero_nf || '-'}</td>
                                                <td className="px-6 py-4text-sm text-gray-600">{pedido.cliente_nome}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatarData(pedido.data_pedido)}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {formatarMoeda(pedido.valor_total)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={pedido.status} />
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{pedido.regiao_nome || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/pedidos/${pedido.id}`);
                                                            }}
                                                            className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Ver detalhes"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                {busca ? 'Nenhum pedido encontrado com os filtros aplicados' : 'Nenhum pedido cadastrado'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {totalPaginas > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Página {paginaAtual} de {totalPaginas}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPaginaAtual(paginaAtual - 1)}
                                        disabled={paginaAtual === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setPaginaAtual(paginaAtual + 1)}
                                        disabled={paginaAtual === totalPaginas}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
